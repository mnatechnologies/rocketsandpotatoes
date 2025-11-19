import { Resend } from 'resend';
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail';

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
    const { data: emailData, error } = await resend.emails.send({
      from: 'Australian National Bullion <onboarding@resend.dev>',
      to: [data.customerEmail],
      subject: `Order Confirmation - ${data.orderNumber}`,
      react: OrderConfirmationEmail(data),
    });

    if (error) {
      console.error('[EMAIL] Error sending order confirmation:', error);
      throw error;
    }

    console.log('[EMAIL] Order confirmation sent successfully:', emailData);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error('[EMAIL] Failed to send order confirmation:', error);
    return { success: false, error };
  }
}