import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { generateUniqueReference } from '@/lib/bank-transfer/reference';
import { getBankTransferSettings } from '@/lib/bank-transfer/settings';
import { generateTTR } from '@/lib/compliance/ttr-generator';
import { sendEmail } from '@/lib/email/ses';

const logger = createLogger('BANK_TRANSFER_CONFIRM_HOLD');

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

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

export async function POST(req: NextRequest) {
  logger.log('Bank transfer confirm hold request received');

  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const { bankTransferOrderId, paymentIntentId } = await req.json();

    if (!bankTransferOrderId) {
      return NextResponse.json({ error: 'bankTransferOrderId is required' }, { status: 400 });
    }
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId is required' }, { status: 400 });
    }

    logger.log('Request params:', { bankTransferOrderId, paymentIntentId });

    // 3. Fetch bank_transfer_order and verify status
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

    if (order.status !== 'hold_pending') {
      logger.log('Order not in hold_pending status:', order.status);
      return NextResponse.json(
        { error: `Order is in '${order.status}' status, expected 'hold_pending'` },
        { status: 400 }
      );
    }

    // 4. Fetch associated transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', order.transaction_id)
      .single();

    if (txError || !transaction) {
      logger.error('Transaction not found:', txError);
      return NextResponse.json(
        { error: 'Associated transaction not found' },
        { status: 404 }
      );
    }

    logger.log('Transaction found:', {
      id: transaction.id,
      amount_aud: transaction.amount_aud,
      customer_id: transaction.customer_id,
    });

    // 5. Retrieve Stripe PaymentIntent and verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'requires_capture') {
      logger.log('PaymentIntent not in requires_capture status:', paymentIntent.status);
      return NextResponse.json(
        { error: `PaymentIntent is in '${paymentIntent.status}' status, expected 'requires_capture'` },
        { status: 400 }
      );
    }

    logger.log('PaymentIntent verified:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    // 6. Generate unique reference code
    const referenceCode = await generateUniqueReference();
    logger.log('Reference code generated:', referenceCode);

    // 7. Fetch settings for payment_window_hours
    const settings = await getBankTransferSettings();
    const deadline = new Date(Date.now() + settings.payment_window_hours * 3600000).toISOString();

    logger.log('Payment deadline calculated:', {
      paymentWindowHours: settings.payment_window_hours,
      deadline,
    });

    // 8. Update bank_transfer_order
    const { error: updateOrderError } = await supabase
      .from('bank_transfer_orders')
      .update({
        status: 'awaiting_transfer',
        hold_status: 'authorized',
        reference_code: referenceCode,
        payment_deadline: deadline,
      })
      .eq('id', bankTransferOrderId);

    if (updateOrderError) {
      logger.error('Failed to update bank transfer order:', updateOrderError);
      return NextResponse.json(
        { error: 'Failed to update bank transfer order' },
        { status: 500 }
      );
    }

    logger.log('Bank transfer order updated to awaiting_transfer');

    // 9. Update transaction payment status
    const { error: updateTxError } = await supabase
      .from('transactions')
      .update({
        payment_status: 'awaiting_bank_transfer',
      })
      .eq('id', transaction.id);

    if (updateTxError) {
      logger.error('Failed to update transaction:', updateTxError);
      // Non-fatal: order is already updated, continue
    }

    logger.log('Transaction updated to awaiting_bank_transfer');

    // 10. Generate TTR if amount_aud >= 10000
    if (transaction.amount_aud >= 10000) {
      logger.log('Transaction meets TTR threshold, generating TTR...');
      try {
        // Fetch customer name for TTR
        const { data: customer } = await supabase
          .from('customers')
          .select('first_name, last_name')
          .eq('id', transaction.customer_id)
          .single();

        const customerName = customer
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : 'Unknown Customer';

        await generateTTR({
          transactionId: transaction.id,
          customerId: transaction.customer_id,
          amount_aud: transaction.amount_aud,
          currency: 'AUD',
          transactionDate: transaction.created_at,
          customerName,
        });
        logger.log('TTR generated successfully');
      } catch (ttrError) {
        logger.error('Failed to generate TTR (non-fatal):', ttrError);
        // TTR failure should not block the confirm-hold flow
      }
    }

    // 11. Send invoice email
    try {
      const customerEmail = transaction.metadata?.customer_email
        || transaction.customer_email;

      // Fetch customer email from customers table if not on transaction
      let emailTo = customerEmail;
      if (!emailTo) {
        const { data: customerRecord } = await supabase
          .from('customers')
          .select('email')
          .eq('id', transaction.customer_id)
          .single();
        emailTo = customerRecord?.email;
      }

      if (emailTo) {
        const formattedDeadline = new Date(deadline).toLocaleString('en-AU', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Australia/Sydney',
        });

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
    .bank-details { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .bank-details table { width: 100%; border-collapse: collapse; }
    .bank-details td { padding: 8px 0; }
    .bank-details td:first-child { font-weight: bold; width: 40%; color: #555; }
    .reference-box { background-color: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
    .reference-code { font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #2e7d32; }
    .deadline-box { background-color: #fff3e0; border: 1px solid #ff9800; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #1a1a2e; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #999; }
    .important { color: #d32f2f; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Australian National Bullion</h1>
      <p style="margin: 5px 0 0;">Bank Transfer Payment Invoice</p>
    </div>
    <div class="content">
      <p>Thank you for your order. Please complete the bank transfer using the details below.</p>

      <div class="reference-box">
        <p style="margin: 0 0 5px; font-size: 14px; color: #555;">Your Reference Code</p>
        <div class="reference-code">${referenceCode}</div>
        <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Include this reference in your bank transfer description</p>
      </div>

      <p class="amount">Amount Due: ${formattedAmount}</p>

      <div class="bank-details">
        <h3 style="margin-top: 0;">Bank Transfer Details</h3>
        <table>
          <tr>
            <td>Bank Name</td>
            <td>${order.bank_name}</td>
          </tr>
          <tr>
            <td>BSB</td>
            <td>${order.bsb}</td>
          </tr>
          <tr>
            <td>Account Number</td>
            <td>${order.account_number}</td>
          </tr>
          <tr>
            <td>Account Name</td>
            <td>${order.account_name}</td>
          </tr>
          ${order.payid_identifier ? `
          <tr>
            <td>PayID (${order.payid_type || 'Email'})</td>
            <td>${order.payid_identifier}</td>
          </tr>
          ` : ''}
          <tr>
            <td>Reference</td>
            <td><strong>${referenceCode}</strong></td>
          </tr>
        </table>
      </div>

      <div class="deadline-box">
        <p style="margin: 0;"><strong>Payment Deadline:</strong> ${formattedDeadline}</p>
        <p style="margin: 5px 0 0; font-size: 13px;">Please ensure your transfer is completed before this deadline. Failure to pay on time may result in order cancellation and forfeiture of the security deposit.</p>
      </div>

      <p class="important">Important: You must include the reference code "${referenceCode}" in your transfer description so we can match your payment.</p>
    </div>
    <div class="footer">
      <p>Australian National Bullion</p>
      <p>This is an automated email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;

        await sendEmail({
          to: emailTo,
          subject: `Bank Transfer Invoice - ${referenceCode}`,
          html,
        });
        logger.log('Invoice email sent to:', emailTo);
      } else {
        logger.warn('No customer email found, skipping invoice email');
      }
    } catch (emailError) {
      logger.error('Failed to send invoice email (non-fatal):', emailError);
      // Email failure should not block the confirm-hold flow
    }

    // 12. Create audit log entry
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'bank_transfer_hold_confirmed',
      entity_type: 'bank_transfer_order',
      entity_id: bankTransferOrderId,
      description: `Bank transfer hold confirmed for ${referenceCode}`,
      metadata: {
        reference_code: referenceCode,
        payment_deadline: deadline,
        deposit_amount_aud: order.deposit_amount_aud,
      },
      created_at: new Date().toISOString(),
    });

    if (auditError) {
      logger.error('Failed to create audit log (non-fatal):', auditError);
    }

    // 13. Return response
    logger.log('Confirm hold completed successfully:', {
      referenceCode,
      deadline,
    });

    return NextResponse.json({
      referenceCode,
      bankName: order.bank_name,
      bsb: order.bsb,
      accountNumber: order.account_number,
      accountName: order.account_name,
      payidIdentifier: order.payid_identifier,
      payidType: order.payid_type,
      amountAud: transaction.amount_aud,
      paymentDeadline: deadline,
      depositAmountAud: order.deposit_amount_aud,
    });
  } catch (error: unknown) {
    logger.error('Error confirming bank transfer hold:', error);
    return NextResponse.json(
      { error: 'Failed to confirm bank transfer hold' },
      { status: 500 }
    );
  }
}
