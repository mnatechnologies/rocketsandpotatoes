import { sendEmail, getComplianceAlertRecipients } from '@/lib/email/ses';
import { sendAdminAlertSMS } from '@/lib/notifications/sns';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ADMIN_ORDER_NOTIFICATION');

interface OrderNotificationParams {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amountAud: number;
  paymentMethod: 'card' | 'bank_transfer';
  itemsSummary: string;
}

/**
 * Send email + SMS notification to admin when a new order is placed.
 * Non-blocking — errors are logged but never thrown.
 */
export async function sendAdminOrderNotification({
  orderId,
  customerName,
  customerEmail,
  amountAud,
  paymentMethod,
  itemsSummary,
}: OrderNotificationParams): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amountAud);

  const paymentLabel = paymentMethod === 'card' ? 'Card Payment' : 'Bank Transfer';
  const shortId = orderId.slice(0, 8);

  // Email notification
  try {
    const recipients = getComplianceAlertRecipients();
    if (recipients.length > 0) {
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
    .order-box { background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #555; }
    .amount { font-size: 24px; font-weight: bold; color: #1a1a2e; }
    .footer { padding: 15px 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Order Received</h1>
    </div>
    <div class="content">
      <div class="order-box">
        <p class="amount">${formattedAmount}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td class="label" style="padding: 8px 0;">Order ID</td><td style="padding: 8px 0;">${shortId}...</td></tr>
          <tr><td class="label" style="padding: 8px 0;">Customer</td><td style="padding: 8px 0;">${customerName}</td></tr>
          <tr><td class="label" style="padding: 8px 0;">Email</td><td style="padding: 8px 0;">${customerEmail}</td></tr>
          <tr><td class="label" style="padding: 8px 0;">Payment</td><td style="padding: 8px 0;">${paymentLabel}</td></tr>
          <tr><td class="label" style="padding: 8px 0;">Items</td><td style="padding: 8px 0;">${itemsSummary}</td></tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/fulfillment" style="display: inline-block; padding: 12px 24px; background-color: #1a1a2e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin</a>
      </p>
    </div>
    <div class="footer">
      <p>Australian National Bullion — Admin Notification</p>
    </div>
  </div>
</body>
</html>`;

      await sendEmail({
        to: recipients,
        subject: `New Order: ${formattedAmount} (${paymentLabel}) — ${shortId}`,
        html,
      });
      logger.log('Admin order email sent to:', recipients.join(', '));
    } else {
      logger.warn('No admin email recipients configured');
    }
  } catch (error) {
    logger.error('Failed to send admin order email (non-blocking):', error);
  }

  // SMS notification
  try {
    const smsMessage = `ANB New Order: ${formattedAmount} from ${customerName} (${paymentLabel}). Order: ${shortId}. Check admin dashboard.`;
    const smsResult = await sendAdminAlertSMS(smsMessage);
    if (smsResult.sent > 0) {
      logger.log(`Admin order SMS sent to ${smsResult.sent} recipient(s)`);
    }
  } catch (error) {
    logger.error('Failed to send admin order SMS (non-blocking):', error);
  }
}
