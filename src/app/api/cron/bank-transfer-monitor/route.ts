import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { createLogger } from '@/lib/utils/logger';
import { getBankTransferSettings } from '@/lib/bank-transfer/settings';
import { calculateMarketLoss } from '@/lib/bank-transfer/market-loss';
import {
  sendBankTransferReminderEmail,
  sendBankTransferExpiredEmail,
} from '@/lib/email/sendBankTransferEmails';
import { matchBankTransfers } from '@/lib/xero/bank-matching';

const logger = createLogger('BANK_TRANSFER_MONITOR');

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function GET(req: NextRequest) {
  // Verify cron authorization
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!cronSecret && !isVercelCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const settings = await getBankTransferSettings();

    let remindersSent = 0;
    let ordersExpired = 0;

    // ── Job 1: Send reminders for orders approaching deadline ──

    const reminderCutoff = new Date(
      Date.now() + settings.reminder_hours_before * 3600000
    ).toISOString();

    const { data: reminderOrders } = await supabase
      .from('bank_transfer_orders')
      .select(
        '*, transactions!inner(customer_id, amount_aud, product_details, metadata)'
      )
      .eq('status', 'awaiting_transfer')
      .is('reminder_sent_at', null)
      .lte('payment_deadline', reminderCutoff);

    for (const order of reminderOrders || []) {
      try {
        const transaction = Array.isArray(order.transactions)
          ? order.transactions[0]
          : order.transactions;

        // Fetch customer email
        const { data: customer } = await supabase
          .from('customers')
          .select('id, email, first_name, last_name')
          .eq('id', transaction.customer_id)
          .single();

        if (!customer?.email) {
          logger.warn(
            'No customer email found for reminder, skipping:',
            order.reference_code
          );
          continue;
        }

        const hoursRemaining = Math.max(
          0,
          Math.round(
            (new Date(order.payment_deadline).getTime() - Date.now()) / 3600000
          )
        );

        const customerName =
          `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
          'Customer';

        await sendBankTransferReminderEmail({
          customerName,
          customerEmail: customer.email,
          referenceCode: order.reference_code,
          amountAud: transaction.amount_aud,
          bankName: order.bank_name,
          bsb: order.bsb,
          accountNumber: order.account_number,
          accountName: order.account_name,
          payidIdentifier: order.payid_identifier ?? undefined,
          payidType: order.payid_type ?? undefined,
          paymentDeadline: order.payment_deadline,
          hoursRemaining,
        });

        // Mark reminder as sent
        await supabase
          .from('bank_transfer_orders')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', order.id);

        remindersSent++;
        logger.log('Reminder sent for order:', order.reference_code);
      } catch (err) {
        logger.error(
          `Error processing reminder for order ${order.reference_code}:`,
          err
        );
      }
    }

    // ── Job 2: Expire overdue orders ──

    const { data: expiredOrders } = await supabase
      .from('bank_transfer_orders')
      .select(
        '*, transactions!inner(id, customer_id, amount_aud, amount, currency, product_details, metadata)'
      )
      .eq('status', 'awaiting_transfer')
      .lt('payment_deadline', new Date().toISOString());

    for (const order of expiredOrders || []) {
      try {
        const transaction = Array.isArray(order.transactions)
          ? order.transactions[0]
          : order.transactions;

        // Calculate market loss (using locked price for now — no live price fetch)
        const result = calculateMarketLoss({
          lockedTotalAud: transaction.amount_aud,
          currentTotalAud: transaction.amount_aud, // TODO: fetch live spot prices
          depositAmountAud: order.deposit_amount_aud,
          cancellationFeePercentage: settings.cancellation_fee_percentage,
        });

        // Handle Stripe hold
        if (result.shouldCapture) {
          await stripe.paymentIntents.capture(order.stripe_hold_intent_id, {
            amount_to_capture: Math.round(result.captureAmount * 100),
          });
          logger.log('Hold captured for expired order:', {
            reference: order.reference_code,
            amount: result.captureAmount,
          });
        } else {
          await stripe.paymentIntents.cancel(order.stripe_hold_intent_id);
          logger.log(
            'Hold voided for expired order:',
            order.reference_code
          );
        }

        // Update bank_transfer_order
        await supabase
          .from('bank_transfer_orders')
          .update({
            status: 'expired',
            hold_status: result.shouldCapture ? 'captured' : 'voided',
            hold_captured_amount: result.shouldCapture
              ? result.captureAmount
              : null,
            hold_capture_reason: result.shouldCapture
              ? `Market loss: $${result.marketLoss}, Fee: $${result.cancellationFee}`
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        // Update transaction payment status
        await supabase
          .from('transactions')
          .update({ payment_status: 'failed' })
          .eq('id', transaction.id);

        // Release price locks
        const sessionId = transaction.metadata?.session_id;
        if (sessionId) {
          await supabase
            .from('price_locks')
            .update({ status: 'expired' })
            .eq('session_id', sessionId);
        }

        // Send expiry email
        const { data: customer } = await supabase
          .from('customers')
          .select('id, email, first_name, last_name')
          .eq('id', transaction.customer_id)
          .single();

        if (customer?.email) {
          const customerName =
            `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
            'Customer';

          await sendBankTransferExpiredEmail({
            customerName,
            customerEmail: customer.email,
            referenceCode: order.reference_code,
            holdCaptured: result.shouldCapture,
            holdCapturedAmount: result.shouldCapture
              ? result.captureAmount
              : undefined,
            marketLossAmount: result.marketLoss > 0
              ? result.marketLoss
              : undefined,
          });
        } else {
          logger.warn(
            'No customer email found for expiry notification:',
            order.reference_code
          );
        }

        // Audit log
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert({
            action_type: 'bank_transfer_order_expired',
            entity_type: 'bank_transfer_order',
            entity_id: order.id,
            description: `Bank transfer order expired for ${order.reference_code}`,
            metadata: {
              reference_code: order.reference_code,
              transaction_id: transaction.id,
              hold_captured: result.shouldCapture,
              hold_captured_amount: result.shouldCapture
                ? result.captureAmount
                : null,
              market_loss: result.marketLoss,
              cancellation_fee: result.cancellationFee,
              amount_aud: transaction.amount_aud,
            },
            created_at: new Date().toISOString(),
          });

        if (auditError) {
          logger.error(
            'Failed to create audit log (non-fatal):',
            auditError
          );
        }

        ordersExpired++;
        logger.log('Order expired:', order.reference_code);
      } catch (err) {
        logger.error(
          `Error processing expired order ${order.reference_code}:`,
          err
        );
      }
    }

    // ── Job 3: Xero bank transfer matching ──
    // Isolated in try/catch — Xero failures never affect Jobs 1 & 2
    let xeroMatched = 0;
    let xeroMismatches = 0;
    try {
      const matchResult = await matchBankTransfers(supabase);
      xeroMatched = matchResult.ordersMatched;
      xeroMismatches = matchResult.amountMismatches;
      if (matchResult.errors.length > 0) {
        logger.warn('Xero matching completed with errors:', matchResult);
      }
    } catch (xeroError) {
      logger.error('Xero bank matching failed (non-fatal):', xeroError);
    }

    logger.log('Monitor complete:', { remindersSent, ordersExpired, xeroMatched, xeroMismatches });

    return NextResponse.json({
      success: true,
      remindersSent,
      ordersExpired,
      xeroMatched,
      xeroMismatches,
    });
  } catch (error) {
    logger.error('Bank transfer monitor failed:', error);
    return NextResponse.json(
      { success: false, error: 'Monitor failed' },
      { status: 500 }
    );
  }
}
