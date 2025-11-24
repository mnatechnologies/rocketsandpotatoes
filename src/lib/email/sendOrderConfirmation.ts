import { Resend } from 'resend';
import { render } from  '@react-email/render'
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('EMAIL');
const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { data: emailData, error } = await resend.emails.send({
      from: 'Australian National Bullion <onboarding@resend.dev>',
     // TODO FIX EMAIL SENDER,
      // to: [data.customerEmail] removed for dev,
      to: 'devops@mnatechnologies.com.au',
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: emailHtml
    });

    if (error) {
      logger.error('Error sending order confirmation:', error);
      throw error;
    }

    logger.log('Order confirmation sent successfully:', emailData);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    logger.error('Failed to send order confirmation:', error);
    return { success: false, error };
  }
}