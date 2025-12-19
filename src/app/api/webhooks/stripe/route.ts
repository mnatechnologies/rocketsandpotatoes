import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmation';
import { comparePaymentMethodName } from '@/lib/compliance/name-matching';


const logger = createLogger('STRIPE_PAYMENT_WEBHOOK');

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!sig) {
    logger.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  logger.log(`Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.log('Payment succeeded:', paymentIntent.id);

        // Find transaction by payment intent ID
        const { data: existingTransaction, error: findError } = await supabase
            .from('transactions')
            .select('*')
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .single();

        if (!existingTransaction) {
          logger.error('⚠️ Transaction not found for payment intent:', paymentIntent.id);
          await supabase.from('audit_logs').insert({
            action_type: 'payment_intent_orphaned',
            entity_type: 'payment_intent',
            entity_id: paymentIntent.id,
            description: 'Payment succeeded but no transaction found',
            metadata: { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount },
          });
          return NextResponse.json({ received: true });
        }

        // ✅ Fetch customer for name comparison
        const { data: customer } = await supabase
            .from('customers')
            .select('id, first_name, last_name, verification_status, verification_level')
            .eq('id', existingTransaction.customer_id)
            .single();

        // ✅ Check payment name mismatch (fraud detection)
        let paymentCardholderName = null;
        let paymentNameMismatch = false;
        let paymentNameMismatchSeverity: 'none' | 'low' | 'medium' | 'high' = 'none';
        let nameComparisonDetails = null;

        if (customer && paymentIntent.payment_method) {
          try {
            logger.log('🔍 Checking payment name mismatch...');

            const paymentMethodId = paymentIntent.payment_method as string;

            // Retrieve payment method to get cardholder name
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            paymentCardholderName = paymentMethod.billing_details.name;

            logger.log(`Cardholder name: "${paymentCardholderName}"`);

            // Compare if customer has name
            if (customer.first_name && customer.last_name) {
              const hasKYCVerification = customer.verification_status === 'verified' &&
                  customer.verification_level === 'stripe_identity';

              const nameComparison = await comparePaymentMethodName(
                  customer.first_name,
                  customer.last_name,
                  hasKYCVerification,
                  paymentMethodId,
                  stripe
              );

              paymentNameMismatch = !nameComparison.isMatch;
              paymentNameMismatchSeverity = nameComparison.mismatchSeverity;
              nameComparisonDetails = {
                severity: nameComparison.mismatchSeverity,
                confidence: nameComparison.confidence,
                details: nameComparison.details,
                customerName: nameComparison.customerName,
                paymentName: nameComparison.paymentName,
                hasKYC: hasKYCVerification,
              };

              if (paymentNameMismatch) {
                logger.log(`⚠️ Payment name mismatch detected:`, nameComparisonDetails);

                // Log to audit trail
                await supabase.from('audit_logs').insert({
                  action_type: 'payment_name_mismatch',
                  entity_type: 'transaction',
                  entity_id: existingTransaction.id,
                  description: `Payment name mismatch: Card "${nameComparison.paymentName}" vs ${hasKYCVerification ? 'verified ID' : 'registered'} "${nameComparison.customerName}" (Severity: ${paymentNameMismatchSeverity})`,
                  metadata: nameComparisonDetails,
                  created_at: new Date().toISOString(),
                });
              } else {
                logger.log(`✅ Payment name matches customer name (${nameComparison.confidence}% confidence)`);
              }
            }
          } catch (error) {
            logger.error('❌ Error checking payment name mismatch:', error);
            // Continue processing even if name check fails
          }
        }

        // Update transaction with payment details and name mismatch info
        const { error: updateError } = await supabase.from('transactions').update({
          payment_status: 'succeeded',
          payment_method: paymentIntent.payment_method,
          payment_cardholder_name: paymentCardholderName,
          payment_name_mismatch: paymentNameMismatch,
          payment_name_mismatch_severity: paymentNameMismatchSeverity,
          updated_at: new Date().toISOString(),
        }).eq('id', existingTransaction.id);

        if (updateError) {
          logger.error('Failed to update transaction:', updateError);
          break;
        }

        logger.log('Transaction updated to completed:', existingTransaction.id);

        // Mark price locks as used
        if (paymentIntent.metadata.session_id) {
          await supabase
              .from('price_locks')
              .update({ status: 'used' })
              .eq('session_id', paymentIntent.metadata.session_id);

          logger.log('Price locks marked as used for session:', paymentIntent.metadata.session_id);
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
          action_type: 'payment_completed',
          entity_type: 'transaction',
          entity_id: existingTransaction.id,
          description: `Payment completed via Stripe: ${paymentIntent.id}`,
          metadata: {
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            payment_method: paymentIntent.payment_method,
            paymentNameMismatch: nameComparisonDetails,  // ✅ ADD
          },
          created_at: new Date().toISOString(),
        });

        // Fetch full customer data for email
      //   const { data: customerForEmail } = await supabase
      //       .from('customers')
      //       .select('*')
      //       .eq('id', existingTransaction.customer_id)
      //       .single();
      //
      //   if (customerForEmail) {
      //     // Send order confirmation email
      //     try {
      //       const emailItems = (existingTransaction.product_details?.items || []).map((item: any) => ({
      //         name: item.product?.name || item.name || 'Unknown Product',
      //         quantity: item.quantity || 1,
      //         price: (item.product?.calculated_price || item.product?.price || item.price || 0) * (item.quantity || 1),
      //         weight: item.product?.weight || item.weight,
      //         purity: item.product?.purity || item.purity,
      //       }));
      //
      //       await sendOrderConfirmationEmail({
      //         orderNumber: existingTransaction.id,
      //         customerName: `${customerForEmail.first_name} ${customerForEmail.last_name}`,
      //         customerEmail: customerForEmail.email,
      //         orderDate: new Date(existingTransaction.created_at).toLocaleDateString('en-AU', {
      //           year: 'numeric',
      //           month: 'long',
      //           day: 'numeric'
      //         }),
      //         items: emailItems,
      //         subtotal: existingTransaction.amount,
      //         total: existingTransaction.amount,
      //         currency: existingTransaction.currency.toUpperCase(),
      //         paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
      //         requiresKYC: existingTransaction.requires_kyc || false,
      //         requiresTTR: existingTransaction.requires_ttr || false,
      //       });
      //
      //       logger.log('Order confirmation email sent to:', customerForEmail.email);
      //     } catch (emailError) {
      //       logger.error('Failed to send order confirmation email:', emailError);
      //     }
      //   }
      //
        break;
       }


      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.log('Payment failed:', paymentIntent.id);

        // Update existingTransaction status to failed
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          logger.error('Failed to update transaction:', updateError);
          break;
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
          action_type: 'payment_failed',
          entity_type: 'transaction',
          entity_id: paymentIntent.id,
          description: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
          metadata: {
            payment_intent_id: paymentIntent.id,
            error: paymentIntent.last_payment_error,
          },
          created_at: new Date().toISOString(),
        });

        logger.log('Transaction marked as failed');
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.log('Payment canceled:', paymentIntent.id);

        // Update transaction status to canceled
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            payment_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          logger.error('Failed to update transaction:', updateError);
          break;
        }

        // Release price locks
        if (paymentIntent.metadata.session_id) {
          await supabase
            .from('price_locks')
            .update({ status: 'expired' })
            .eq('session_id', paymentIntent.metadata.session_id);

          logger.log('Price locks released for session:', paymentIntent.metadata.session_id);
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
          action_type: 'payment_canceled',
          entity_type: 'transaction',
          entity_id: paymentIntent.id,
          description: 'Payment canceled',
          metadata: {
            payment_intent_id: paymentIntent.id,
          },
          created_at: new Date().toISOString(),
        });

        logger.log('Transaction marked as canceled');
        break;
      }

      default:
        logger.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
