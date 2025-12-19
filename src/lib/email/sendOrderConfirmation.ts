import { render } from '@react-email/render';
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail';
import { createLogger } from '@/lib/utils/logger';
import { sendEmail } from './ses';

const logger = createLogger('EMAIL');

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    weight?: string;
    purity?: string;
  }>;
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod: string;
  requiresKYC?: boolean;
  requiresTTR?: boolean;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    const emailHtml = await render(OrderConfirmationEmail(data));

    const result = await sendEmail({
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: emailHtml,
    });

    if (!result.success) {
      logger.error('Error sending order confirmation:', result.error);
      return { success: false, error: result.error };
    }

    logger.log('Order confirmation sent successfully:', result.messageId);
    return { success: true, emailId: result.messageId };
  } catch (error) {
    logger.error('Failed to send order confirmation:', error);
    return { success: false, error };
  }
}