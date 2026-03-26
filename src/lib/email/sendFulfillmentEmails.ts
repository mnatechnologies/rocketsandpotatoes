import { sendEmail } from '@/lib/email/ses';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FULFILLMENT_EMAIL');

interface FulfillmentEmailParams {
  customerEmail: string;
  customerName: string;
  orderId: string;
}

export async function sendReadyForPickupEmail({
  customerEmail,
  customerName,
  orderId,
}: FulfillmentEmailParams): Promise<void> {
  const shortId = orderId.slice(0, 8);

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
    .pickup-box { background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .footer { padding: 15px 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Order Is Ready for Pickup</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Great news! Your order <strong>${shortId}...</strong> has been packed and is ready for collection.</p>
      <div class="pickup-box">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2e7d32;">Ready for Pickup</p>
        <p style="margin: 10px 0 0; font-size: 14px; color: #555;">Please bring a valid photo ID when collecting your order.</p>
      </div>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Thank you for your business.</p>
    </div>
    <div class="footer">
      <p>Australian National Bullion</p>
      <p>This is an automated email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: customerEmail,
      subject: `Your Order Is Ready for Pickup — ${shortId}`,
      html,
    });
    logger.log('Ready for pickup email sent to:', customerEmail);
  } catch (error) {
    logger.error('Failed to send ready for pickup email:', error);
    throw error;
  }
}

export async function sendCollectedEmail({
  customerEmail,
  customerName,
  orderId,
}: FulfillmentEmailParams): Promise<void> {
  const shortId = orderId.slice(0, 8);

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
    .footer { padding: 15px 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Collected</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Your order <strong>${shortId}...</strong> has been collected. Thank you for choosing Australian National Bullion.</p>
      <p>If you have any questions or concerns, please contact us.</p>
    </div>
    <div class="footer">
      <p>Australian National Bullion</p>
      <p>This is an automated email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      to: customerEmail,
      subject: `Order Collected — ${shortId}`,
      html,
    });
    logger.log('Collected email sent to:', customerEmail);
  } catch (error) {
    logger.error('Failed to send collected email:', error);
    throw error;
  }
}
