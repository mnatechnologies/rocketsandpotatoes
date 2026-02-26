import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { sendEmail, getComplianceAlertRecipients } from '@/lib/email/ses';

const logger = createLogger('BANK_TRANSFER_NOTIFY');

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  logger.log('Customer notify-transferred request for order:', id);

  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse optional body
    const body = await req.json().catch(() => ({}));
    const transferReference: string | undefined = body.transferReference;

    // 2. Fetch bank_transfer_order and verify status
    const { data: order, error: orderError } = await supabase
      .from('bank_transfer_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      logger.error('Bank transfer order not found:', orderError);
      return NextResponse.json(
        { error: 'Bank transfer order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'awaiting_transfer') {
      logger.log('Order not in awaiting_transfer status:', order.status);
      return NextResponse.json(
        { error: `Order is in '${order.status}' status, expected 'awaiting_transfer'` },
        { status: 400 }
      );
    }

    // 3. Fetch transaction for ownership check and email details
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', order.transaction_id)
      .single();

    if (txError || !transaction) {
      logger.error('Associated transaction not found:', txError);
      return NextResponse.json(
        { error: 'Associated transaction not found' },
        { status: 404 }
      );
    }

    // 4. Fetch customer and verify ownership
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, clerk_user_id, first_name, last_name, email')
      .eq('id', transaction.customer_id)
      .single();

    if (customerError || !customer) {
      logger.error('Customer not found:', customerError);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (customer.clerk_user_id !== userId) {
      logger.log('Unauthorized access attempt - order does not belong to user');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 5. Update customer_transfer_ref if provided
    if (transferReference) {
      const { error: updateError } = await supabase
        .from('bank_transfer_orders')
        .update({ customer_transfer_ref: transferReference })
        .eq('id', id);

      if (updateError) {
        logger.error('Failed to update customer_transfer_ref:', updateError);
        // Non-fatal: continue with notification
      } else {
        logger.log('Updated customer_transfer_ref:', transferReference);
      }
    }

    // 6. Send admin notification email
    try {
      const recipients = getComplianceAlertRecipients();

      if (recipients.length > 0) {
        const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown';
        const timeRemainingSeconds = Math.max(
          0,
          Math.floor((new Date(order.payment_deadline).getTime() - Date.now()) / 1000)
        );
        const hoursRemaining = Math.floor(timeRemainingSeconds / 3600);
        const minutesRemaining = Math.floor((timeRemainingSeconds % 3600) / 60);

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
    .header h1 { margin: 0; font-size: 20px; }
    .content { padding: 20px; background-color: #ffffff; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { padding: 15px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Customer Reports Transfer Initiated</h1>
    </div>
    <div class="content">
      <p>A customer has indicated they have initiated a bank transfer for the following order:</p>
      <div class="detail-row">
        <span class="detail-label">Customer:</span> ${customerName} (${customer.email})
      </div>
      <div class="detail-row">
        <span class="detail-label">Reference Code:</span> ${order.reference_code}
      </div>
      <div class="detail-row">
        <span class="detail-label">Order Amount:</span> ${formattedAmount}
      </div>
      <div class="detail-row">
        <span class="detail-label">Time Remaining:</span> ${hoursRemaining}h ${minutesRemaining}m
      </div>
      ${transferReference ? `
      <div class="detail-row">
        <span class="detail-label">Customer-Provided Reference:</span> ${transferReference}
      </div>
      ` : ''}
      <p style="margin-top: 20px; font-size: 13px; color: #666;">This is an informational notification only. The order status has not been changed. Please verify the transfer in the bank account before confirming.</p>
    </div>
    <div class="footer">
      <p>Australian National Bullion - Admin Notification</p>
    </div>
  </div>
</body>
</html>`;

        await sendEmail({
          to: recipients,
          subject: `[Admin] Customer reports transfer initiated - ${order.reference_code}`,
          html,
        });
        logger.log('Admin notification email sent for:', order.reference_code);
      } else {
        logger.warn('No compliance alert recipients configured, skipping admin notification');
      }
    } catch (emailError) {
      logger.error('Failed to send admin notification email (non-fatal):', emailError);
      // Email failure should not block the response
    }

    // 7. Create audit log entry
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'bank_transfer_customer_notified',
      entity_type: 'bank_transfer_order',
      entity_id: id,
      description: `Customer notified transfer initiated for ${order.reference_code}`,
      metadata: {
        reference_code: order.reference_code,
        customer_transfer_ref: transferReference,
      },
      created_at: new Date().toISOString(),
    });

    if (auditError) {
      logger.error('Failed to create audit log (non-fatal):', auditError);
    }

    logger.log('Notify-transferred completed successfully for:', order.reference_code);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error in notify-transferred:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer notification' },
      { status: 500 }
    );
  }
}
