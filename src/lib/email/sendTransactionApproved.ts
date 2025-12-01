
import { sendEmail } from './ses';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TRANSACTION_APPROVED_EMAIL');

interface TransactionApprovedEmailProps {
  customerEmail: string;
  customerName: string;
  transactionId: string;
  amount: number;
  currency: string;
  paymentLink: string;
}

export async function sendTransactionApprovedEmail({
                                                     customerEmail,
                                                     customerName,
                                                     transactionId,
                                                     amount,
                                                     currency,
                                                     paymentLink,
                                                   }: TransactionApprovedEmailProps) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">✅ Transaction Approved</h2>
      
      <p>Dear ${customerName},</p>
      
      <p>Good news! Your transaction has been approved by our compliance team.</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
        <p style="margin: 8px 0 0 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
      </div>
      
      <p><strong>Next Step:</strong> Please complete your payment to finalize your order.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${paymentLink}" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Complete Payment
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        This link will expire in 24 hours. If you have any questions, please contact our support team.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px;">
        Rockets & Potatoes<br>
        Precious Metals Trading
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: [customerEmail],
    subject: 'Transaction Approved - Complete Your Payment',
    html,
  });

  if (result.success) {
    logger.log('Transaction approved email sent successfully to:', customerEmail);
  } else {
    logger.error('Failed to send transaction approved email:', result.error);
  }

  return result;
}