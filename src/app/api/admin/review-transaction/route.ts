
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { sendTransactionApprovedEmail } from '@/lib/email/sendTransactionApproved';
import { sendTransactionRejectedEmail } from '@/lib/email/sendTransactionRejected';
import Stripe from 'stripe';

const logger = createLogger('ADMIN_REVIEW_API');

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { transactionId, decision, notes } = await req.json();

  if (!notes || notes.trim().length === 0) {
    return NextResponse.json({ error: 'Review notes are required' }, { status: 400 });
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

  const { data: adminCustomer, error: adminError } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name')
    .eq('clerk_user_id', adminCheck.userId)
    .single();

  if (adminError || !adminCustomer) {
    logger.error('Failed to find admin customer record:', adminError);
    return NextResponse.json(
      { error: 'Admin customer record not found' },
      { status: 500 }
    );
  }

  logger.log('Admin reviewing transaction:', {
    adminId: adminCustomer.id,
    adminEmail: adminCustomer.email,
    transactionId,
    decision,
  });

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*, customer:customers(id, email, first_name, last_name, clerk_user_id, requires_enhanced_dd, edd_completed)')
    .eq('id', transactionId)
    .single();

  if (fetchError || !transaction) {
    logger.error('Transaction not found:', fetchError);
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // If approving, create payment intent if it doesn't exist
  let paymentIntentId = transaction.stripe_payment_intent_id;

  if (decision === 'approve' && !paymentIntentId) {
    try {
      logger.log('Creating payment intent for approved transaction');

      // Get or create Stripe customer
      let stripeCustomerId: string | undefined;

      if (transaction.customer?.email) {
        const existingCustomers = await stripe.customers.list({
          email: transaction.customer.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
          logger.log('Found existing Stripe customer:', stripeCustomerId);
        } else {
          const customer = await stripe.customers.create({
            email: transaction.customer.email,
            metadata: {
              supabase_customer_id: transaction.customer_id,
              clerk_user_id: transaction.customer.clerk_user_id,
            },
          });
          stripeCustomerId = customer.id;
          logger.log('Created new Stripe customer:', stripeCustomerId);
        }
      }

      // Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(transaction.amount * 100), // Convert to cents
        currency: transaction.currency.toLowerCase(),
        customer: stripeCustomerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          supabase_customer_id: transaction.customer_id,
          clerk_user_id: transaction.customer?.clerk_user_id,
          transaction_id: transactionId,
        },
      });

      paymentIntentId = paymentIntent.id;
      logger.log('Payment intent created:', paymentIntentId);
    } catch (stripeError) {
      logger.error('Error creating payment intent:', stripeError);
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      );
    }
  }

  // Update transaction
  const updateData: any = {
    review_status: decision === 'approve' ? 'approved' : 'rejected',
    review_notes: notes,
    reviewed_by: adminCustomer.id,
    reviewed_at: new Date().toISOString(),
  };

  if (decision === 'approve') {
    updateData.payment_status = 'pending_payment';
    if (paymentIntentId) {
      updateData.stripe_payment_intent_id = paymentIntentId;
    }
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', transactionId);

  if (updateError) {
    logger.error('Error updating transaction:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (decision === 'approve') {
    const customerUpdateData: any = {
      last_transaction_reviewed_at: new Date().toISOString(),
    };

    // If customer required EDD and has completed it, mark as no longer requiring it
    if (transaction.customer.requires_enhanced_dd && transaction.customer.edd_completed) {
      customerUpdateData.requires_enhanced_dd = false;
      logger.log('Clearing EDD requirement for customer:', transaction.customer.id);
    }

    // Update customer record
    const { error: customerUpdateError } = await supabase
      .from('customers')
      .update(customerUpdateData)
      .eq('id', transaction.customer.id);

    if (customerUpdateError) {
      logger.error('Error updating customer state:', customerUpdateError);
      // Don't fail the whole operation, just log it
    } else {
      logger.log('Customer state updated successfully');
    }
  }


  // Log audit event
  await supabase.from('audit_logs').insert({
    action_type: 'transaction_reviewed',
    entity_type: 'transaction',
    entity_id: transactionId,
    description: `Transaction ${decision}ed by admin: ${notes}`,
    metadata: {
      decision,
      notes,
      reviewed_by_customer_id: adminCustomer.id,
      reviewed_by_clerk_id: adminCheck.userId,
      admin_email: adminCustomer.email,
      admin_name: `${adminCustomer.first_name} ${adminCustomer.last_name}`,
      payment_intent_id: paymentIntentId,
    },
  });

  if (decision === 'approve') {
    try {
      await sendTransactionApprovedEmail({
        customerEmail: transaction.customer.email,
        customerName: `${transaction.customer.first_name} ${transaction.customer.last_name}`,
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentLink: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/resume?transactionId=${transaction.id}`,
      });
      logger.log('✅ Approval email sent to customer', `${process.env.NEXT_PUBLIC_APP_URL}/checkout/resume?transactionId=${transaction.id}`);
    } catch (emailError) {
      logger.error('Failed to send approval email:', emailError);
    }
  }

  if (decision === 'reject') {
    updateData.payment_status = 'rejected';

    // Cancel payment intent if it exists
    if (transaction.stripe_payment_intent_id) {
      try {
        await stripe.paymentIntents.cancel(transaction.stripe_payment_intent_id);
        logger.log('Payment intent canceled:', transaction.stripe_payment_intent_id);
      } catch (stripeError: any) {
        // Log error but don't fail the whole operation
        // Payment intent might already be canceled or in a non-cancelable state
        logger.error('Failed to cancel payment intent (continuing with rejection):', stripeError.message);
      }
    }
  }


  if (decision === 'reject') {
    try {
      await sendTransactionRejectedEmail({
        customerEmail: transaction.customer.email,
        customerName: `${transaction.customer.first_name} ${transaction.customer.last_name}`,
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        reason: notes,
      });
      logger.log('✅ Rejection email sent to customer');
    } catch (emailError) {
      logger.error('Failed to send rejection email:', emailError);
    }
  }

  logger.log('✅ Transaction review completed successfully');

  return NextResponse.json({ success: true });
}