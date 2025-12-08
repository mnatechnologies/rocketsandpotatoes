import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmation';

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
        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (txError || !transaction) {
          logger.error('Transaction not found for payment intent:', paymentIntent.id, txError);

          // Create a new transaction record if one doesn't exist (edge case)
          const { error: insertError } = await supabase
            .from('transactions')
            .insert({
              customer_id: paymentIntent.metadata.supabase_customer_id,
              transaction_type: 'purchase',
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              stripe_payment_intent_id: paymentIntent.id,
              payment_method: paymentIntent.payment_method as string,
              payment_status: 'completed',
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            logger.error('Failed to create transaction:', insertError);
          }
          break;
        }

        // Update transaction status to completed
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            payment_status: 'completed',
            payment_method: paymentIntent.payment_method as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        if (updateError) {
          logger.error('Failed to update transaction:', updateError);
          break;
        }

        logger.log('Transaction updated to completed:', transaction.id);

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
          entity_id: transaction.id,
          description: `Payment completed via Stripe: ${paymentIntent.id}`,
          metadata: {
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            payment_method: paymentIntent.payment_method,
          },
          created_at: new Date().toISOString(),
        });

        // Fetch customer data for email
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', transaction.customer_id)
          .single();

        if (customer) {
          // Send order confirmation email
          try {
            const emailItems = (transaction.product_details?.items || []).map((item: any) => ({
              name: item.product?.name || item.name || 'Unknown Product',
              quantity: item.quantity || 1,
              price: (item.product?.calculated_price || item.product?.price || item.price || 0) * (item.quantity || 1),
              weight: item.product?.weight || item.weight,
              purity: item.product?.purity || item.purity,
            }));

            await sendOrderConfirmationEmail({
              orderNumber: transaction.id,
              customerName: `${customer.first_name} ${customer.last_name}`,
              customerEmail: customer.email,
              orderDate: new Date(transaction.created_at).toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              items: emailItems,
              subtotal: transaction.amount,
              total: transaction.amount,
              currency: transaction.currency.toUpperCase(),
              paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
              requiresKYC: transaction.requires_kyc || false,
              requiresTTR: transaction.requires_ttr || false,
            });


            logger.log('Order confirmation email sent to:', customer.email);
          } catch (emailError) {
            logger.error('Failed to send order confirmation email:', emailError);
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.log('Payment failed:', paymentIntent.id);

        // Update transaction status to failed
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
