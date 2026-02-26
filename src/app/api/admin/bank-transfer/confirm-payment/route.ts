import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { sendEmail } from '@/lib/email/ses';
import Stripe from 'stripe';

const logger = createLogger('ADMIN_BANK_TRANSFER_CONFIRM');

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

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

  try {
    const { bankTransferOrderId, confirmationNotes } = await req.json();

    if (!bankTransferOrderId) {
      return NextResponse.json(
        { error: 'bankTransferOrderId is required' },
        { status: 400 }
      );
    }

    logger.log('Admin confirming bank transfer payment:', {
      bankTransferOrderId,
      adminUserId: adminCheck.userId,
    });

    // 1. Fetch bank_transfer_order
    const { data: order, error: orderError } = await supabase
      .from('bank_transfer_orders')
      .select('*')
      .eq('id', bankTransferOrderId)
      .single();

    if (orderError || !order) {
      logger.error('Bank transfer order not found:', orderError);
      return NextResponse.json(
        { error: 'Bank transfer order not found' },
        { status: 404 }
      );
    }

    // 2. Race condition check: verify status is awaiting_transfer
    if (order.status !== 'awaiting_transfer') {
      logger.log('Order not in awaiting_transfer status:', order.status);
      return NextResponse.json(
        { error: `Order is in '${order.status}' status, cannot confirm payment` },
        { status: 409 }
      );
    }

    // 3. Fetch associated transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, customer:customers(id, email, first_name, last_name)')
      .eq('id', order.transaction_id)
      .single();

    if (txError || !transaction) {
      logger.error('Associated transaction not found:', txError);
      return NextResponse.json(
        { error: 'Associated transaction not found' },
        { status: 404 }
      );
    }

    // 4. Void Stripe auth hold
    try {
      await stripe.paymentIntents.cancel(order.stripe_hold_intent_id);
      logger.log('Stripe hold voided:', order.stripe_hold_intent_id);
    } catch (stripeError: unknown) {
      const message = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      logger.error('Failed to void Stripe hold:', message);
      return NextResponse.json(
        { error: 'Failed to void Stripe hold' },
        { status: 500 }
      );
    }

    // 5. Update bank_transfer_order
    const { error: updateOrderError } = await supabase
      .from('bank_transfer_orders')
      .update({
        status: 'succeeded',
        hold_status: 'voided',
        confirmed_at: new Date().toISOString(),
        confirmed_by: adminCheck.userId,
        confirmation_notes: confirmationNotes || null,
      })
      .eq('id', bankTransferOrderId);

    if (updateOrderError) {
      logger.error('Failed to update bank transfer order:', updateOrderError);
      return NextResponse.json(
        { error: 'Failed to update bank transfer order' },
        { status: 500 }
      );
    }

    logger.log('Bank transfer order updated to succeeded');

    // 6. Update transaction payment status
    const { error: updateTxError } = await supabase
      .from('transactions')
      .update({ payment_status: 'succeeded' })
      .eq('id', transaction.id);

    if (updateTxError) {
      logger.error('Failed to update transaction:', updateTxError);
    }

    // 7. Mark price locks as used
    const sessionId = transaction.metadata?.session_id;
    if (sessionId) {
      const { error: lockError } = await supabase
        .from('price_locks')
        .update({ status: 'used' })
        .eq('session_id', sessionId);

      if (lockError) {
        logger.error('Failed to update price locks (non-fatal):', lockError);
      } else {
        logger.log('Price locks marked as used for session:', sessionId);
      }
    } else {
      logger.warn('No session_id in transaction metadata, skipping price lock update');
    }

    // 8. Send confirmation email to customer
    const customer = Array.isArray(transaction.customer)
      ? transaction.customer[0]
      : transaction.customer;

    if (customer?.email) {
      try {
        const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';
        const formattedAmount = new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
        }).format(transaction.amount_aud);

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a1a2e; color: #ffffff; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 20px; background-color: #ffffff; }
    .success-box { background-color: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .success-icon { font-size: 48px; }
    .reference { font-size: 18px; font-weight: bold; color: #2e7d32; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Australian National Bullion</h1>
      <p style="margin: 5px 0 0;">Payment Confirmation</p>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>

      <div class="success-box">
        <div class="success-icon">&#10003;</div>
        <h2 style="margin: 10px 0 5px; color: #2e7d32;">Payment Received</h2>
        <p style="margin: 0;">Your bank transfer of <strong>${formattedAmount}</strong> has been confirmed.</p>
        <p class="reference">Reference: ${order.reference_code}</p>
      </div>

      <p>Your security deposit hold has been released and your order is now being processed.</p>
      <p>You will receive further updates as your order progresses.</p>

      <p>If you have any questions, please don't hesitate to contact us.</p>
    </div>
    <div class="footer">
      <p>Australian National Bullion</p>
      <p>This is an automated email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;

        await sendEmail({
          to: customer.email,
          subject: `Payment Confirmed - ${order.reference_code}`,
          html,
        });
        logger.log('Confirmation email sent to:', customer.email);
      } catch (emailError) {
        logger.error('Failed to send confirmation email (non-fatal):', emailError);
      }
    } else {
      logger.warn('No customer email found, skipping confirmation email');
    }

    // 9. Audit log
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'bank_transfer_payment_confirmed',
      entity_type: 'bank_transfer_order',
      entity_id: bankTransferOrderId,
      description: `Bank transfer payment confirmed for ${order.reference_code}`,
      metadata: {
        reference_code: order.reference_code,
        transaction_id: transaction.id,
        confirmed_by_clerk_id: adminCheck.userId,
        confirmation_notes: confirmationNotes || null,
        amount_aud: transaction.amount_aud,
        hold_voided: true,
      },
      created_at: new Date().toISOString(),
    });

    if (auditError) {
      logger.error('Failed to create audit log (non-fatal):', auditError);
    }

    logger.log('Bank transfer payment confirmed successfully:', order.reference_code);

    return NextResponse.json({
      success: true,
      referenceCode: order.reference_code,
    });
  } catch (error: unknown) {
    logger.error('Error confirming bank transfer payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm bank transfer payment' },
      { status: 500 }
    );
  }
}
