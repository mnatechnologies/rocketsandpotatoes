import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { sendEmail } from '@/lib/email/ses';
import Stripe from 'stripe';

const logger = createLogger('ADMIN_BANK_TRANSFER_CANCEL');

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
    const { bankTransferOrderId, reason, captureHold, captureAmount } = await req.json();

    if (!bankTransferOrderId) {
      return NextResponse.json(
        { error: 'bankTransferOrderId is required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    logger.log('Admin cancelling bank transfer order:', {
      bankTransferOrderId,
      reason,
      captureHold,
      captureAmount,
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

    // 2. Verify status is cancellable
    if (order.status !== 'awaiting_transfer' && order.status !== 'hold_pending') {
      logger.log('Order not in cancellable status:', order.status);
      return NextResponse.json(
        { error: `Order is in '${order.status}' status, cannot cancel` },
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

    // 4. Handle Stripe hold: capture or void
    const holdUpdateData: Record<string, unknown> = {};

    if (captureHold) {
      // Capture the hold (full deposit or partial amount)
      const amountCents = Math.round((captureAmount || order.deposit_amount_aud) * 100);

      try {
        await stripe.paymentIntents.capture(order.stripe_hold_intent_id, {
          amount_to_capture: amountCents,
        });
        logger.log('Stripe hold captured:', {
          paymentIntentId: order.stripe_hold_intent_id,
          amountCents,
        });

        holdUpdateData.hold_status = 'captured';
        holdUpdateData.hold_captured_amount = captureAmount || order.deposit_amount_aud;
        holdUpdateData.hold_capture_reason = reason;
      } catch (stripeError: unknown) {
        const message = stripeError instanceof Error ? stripeError.message : 'Unknown error';
        logger.error('Failed to capture Stripe hold:', message);
        return NextResponse.json(
          { error: 'Failed to capture Stripe hold' },
          { status: 500 }
        );
      }
    } else {
      // Void the hold
      try {
        await stripe.paymentIntents.cancel(order.stripe_hold_intent_id);
        logger.log('Stripe hold voided:', order.stripe_hold_intent_id);

        holdUpdateData.hold_status = 'voided';
      } catch (stripeError: unknown) {
        const message = stripeError instanceof Error ? stripeError.message : 'Unknown error';
        logger.error('Failed to void Stripe hold:', message);
        return NextResponse.json(
          { error: 'Failed to void Stripe hold' },
          { status: 500 }
        );
      }
    }

    // 5. Update bank_transfer_order
    const { error: updateOrderError } = await supabase
      .from('bank_transfer_orders')
      .update({
        status: 'cancelled',
        ...holdUpdateData,
      })
      .eq('id', bankTransferOrderId);

    if (updateOrderError) {
      logger.error('Failed to update bank transfer order:', updateOrderError);
      return NextResponse.json(
        { error: 'Failed to update bank transfer order' },
        { status: 500 }
      );
    }

    logger.log('Bank transfer order updated to cancelled');

    // 6. Update transaction payment status
    const { error: updateTxError } = await supabase
      .from('transactions')
      .update({ payment_status: 'failed' })
      .eq('id', transaction.id);

    if (updateTxError) {
      logger.error('Failed to update transaction:', updateTxError);
    }

    // 7. Release price locks
    const sessionId = transaction.metadata?.session_id;
    if (sessionId) {
      const { error: lockError } = await supabase
        .from('price_locks')
        .update({ status: 'expired' })
        .eq('session_id', sessionId);

      if (lockError) {
        logger.error('Failed to release price locks (non-fatal):', lockError);
      } else {
        logger.log('Price locks released for session:', sessionId);
      }
    } else {
      logger.warn('No session_id in transaction metadata, skipping price lock release');
    }

    // 8. Send cancellation email to customer
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

        const holdAction = captureHold
          ? `Your security deposit of ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(captureAmount || order.deposit_amount_aud)} has been charged.`
          : 'Your security deposit hold has been released.';

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
    .cancel-box { background-color: #ffebee; border: 2px solid #f44336; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .reference { font-size: 16px; color: #555; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Australian National Bullion</h1>
      <p style="margin: 5px 0 0;">Order Cancellation</p>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>

      <div class="cancel-box">
        <h2 style="margin: 0 0 10px; color: #d32f2f;">Order Cancelled</h2>
        <p style="margin: 0;">Your bank transfer order for <strong>${formattedAmount}</strong> has been cancelled.</p>
        <p class="reference">Reference: ${order.reference_code}</p>
      </div>

      <p><strong>Reason:</strong> ${reason}</p>
      <p>${holdAction}</p>

      <p>If you have any questions about this cancellation, please contact us.</p>
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
          subject: `Order Cancelled - ${order.reference_code}`,
          html,
        });
        logger.log('Cancellation email sent to:', customer.email);
      } catch (emailError) {
        logger.error('Failed to send cancellation email (non-fatal):', emailError);
      }
    } else {
      logger.warn('No customer email found, skipping cancellation email');
    }

    // 9. Audit log
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'bank_transfer_order_cancelled',
      entity_type: 'bank_transfer_order',
      entity_id: bankTransferOrderId,
      description: `Bank transfer order cancelled for ${order.reference_code}: ${reason}`,
      metadata: {
        reference_code: order.reference_code,
        transaction_id: transaction.id,
        cancelled_by_clerk_id: adminCheck.userId,
        reason,
        hold_captured: captureHold || false,
        hold_captured_amount: captureHold ? (captureAmount || order.deposit_amount_aud) : null,
        amount_aud: transaction.amount_aud,
      },
      created_at: new Date().toISOString(),
    });

    if (auditError) {
      logger.error('Failed to create audit log (non-fatal):', auditError);
    }

    logger.log('Bank transfer order cancelled successfully:', order.reference_code);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error cancelling bank transfer order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel bank transfer order' },
      { status: 500 }
    );
  }
}
