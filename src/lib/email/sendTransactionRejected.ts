
import { sendEmail } from './ses';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TRANSACTION_REJECTED_EMAIL');

interface TransactionRejectedEmailProps {
  customerEmail: string;
  customerName: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: string;
}

export async function sendTransactionRejectedEmail({
                                                     customerEmail,
                                                     customerName,
                                                     transactionId,
                                                     amount,
                                                     currency,
                                                     reason,
                                                   }: TransactionRejectedEmailProps) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Transaction Review Update</h2>
      
      <p>Dear ${customerName},</p>
      
      <p>Thank you for your patience during our compliance review process.</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
        <p style="margin: 8px 0 0 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
      </div>
      
      <p>Unfortunately, we are unable to proceed with this transaction at this time.</p>
      
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #374151;"><strong>Reason:</strong></p>
        <p style="margin: 8px 0 0 0; color: #6b7280;">${reason}</p>
      </div>
      
      <p>If you believe this decision was made in error or would like to discuss this further, please contact our compliance team at compliance@rocketsandpotatoes.com.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px;">
        Rockets & Potatoes<br>
        Precious Metals Trading
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: [customerEmail],
    subject: 'Transaction Review Update',
    html,
  });

  if (result.success) {
    logger.log('Transaction rejected email sent successfully to:', customerEmail);
  } else {
    logger.error('Failed to send transaction rejected email:', result.error);
  }

  return result;
}