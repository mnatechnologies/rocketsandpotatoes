import { render } from '@react-email/render';
import BankTransferInvoiceEmail from '@/emails/BankTransferInvoiceEmail';
import BankTransferReminderEmail from '@/emails/BankTransferReminderEmail';
import BankTransferConfirmedEmail from '@/emails/BankTransferConfirmedEmail';
import BankTransferExpiredEmail from '@/emails/BankTransferExpiredEmail';
import { sendEmail, getComplianceAlertRecipients } from './ses';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BANK-TRANSFER-EMAIL');

interface InvoiceEmailData {
  customerName: string;
  customerEmail: string;
  referenceCode: string;
  amountAud: number;
  bankName: string;
  bsb: string;
  accountNumber: string;
  accountName: string;
  payidIdentifier?: string;
  payidType?: string;
  paymentDeadline: string;
  depositAmountAud: number;
  cardLastFour?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    weight?: string;
    purity?: string;
  }>;
}

interface ReminderEmailData {
  customerName: string;
  customerEmail: string;
  referenceCode: string;
  amountAud: number;
  bankName: string;
  bsb: string;
  accountNumber: string;
  accountName: string;
  payidIdentifier?: string;
  payidType?: string;
  paymentDeadline: string;
  hoursRemaining: number;
}

interface ConfirmedEmailData {
  customerName: string;
  customerEmail: string;
  referenceCode: string;
  amountAud: number;
}

interface ExpiredEmailData {
  customerName: string;
  customerEmail: string;
  referenceCode: string;
  holdCapturedAmount?: number;
  holdCaptured: boolean;
  marketLossAmount?: number;
}

interface AdminNotificationData {
  referenceCode: string;
  customerName: string;
  customerEmail: string;
  amountAud: number;
  customerTransferRef?: string;
}

export async function sendBankTransferInvoiceEmail(data: InvoiceEmailData) {
  try {
    const emailHtml = await render(BankTransferInvoiceEmail({
      customerName: data.customerName,
      referenceCode: data.referenceCode,
      amountAud: data.amountAud,
      bankName: data.bankName,
      bsb: data.bsb,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      payidIdentifier: data.payidIdentifier,
      payidType: data.payidType,
      paymentDeadline: data.paymentDeadline,
      depositAmountAud: data.depositAmountAud,
      cardLastFour: data.cardLastFour,
      items: data.items,
    }));

    const result = await sendEmail({
      to: data.customerEmail,
      subject: `Bank Transfer Invoice - ${data.referenceCode}`,
      html: emailHtml,
    });

    if (!result.success) {
      logger.error('Error sending bank transfer invoice:', result.error);
      return { success: false, error: result.error };
    }

    logger.log('Bank transfer invoice sent successfully:', result.messageId);
    return { success: true, emailId: result.messageId };
  } catch (error) {
    logger.error('Failed to send bank transfer invoice:', error);
    return { success: false, error };
  }
}

export async function sendBankTransferReminderEmail(data: ReminderEmailData) {
  try {
    const emailHtml = await render(BankTransferReminderEmail({
      customerName: data.customerName,
      referenceCode: data.referenceCode,
      amountAud: data.amountAud,
      bankName: data.bankName,
      bsb: data.bsb,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      payidIdentifier: data.payidIdentifier,
      payidType: data.payidType,
      paymentDeadline: data.paymentDeadline,
      hoursRemaining: data.hoursRemaining,
    }));

    const result = await sendEmail({
      to: data.customerEmail,
      subject: `Payment Reminder - ${data.hoursRemaining} hours remaining - ${data.referenceCode}`,
      html: emailHtml,
    });

    if (!result.success) {
      logger.error('Error sending bank transfer reminder:', result.error);
      return { success: false, error: result.error };
    }

    logger.log('Bank transfer reminder sent successfully:', result.messageId);
    return { success: true, emailId: result.messageId };
  } catch (error) {
    logger.error('Failed to send bank transfer reminder:', error);
    return { success: false, error };
  }
}

export async function sendBankTransferConfirmedEmail(data: ConfirmedEmailData) {
  try {
    const emailHtml = await render(BankTransferConfirmedEmail({
      customerName: data.customerName,
      referenceCode: data.referenceCode,
      amountAud: data.amountAud,
    }));

    const result = await sendEmail({
      to: data.customerEmail,
      subject: `Payment Confirmed - ${data.referenceCode}`,
      html: emailHtml,
    });

    if (!result.success) {
      logger.error('Error sending bank transfer confirmation:', result.error);
      return { success: false, error: result.error };
    }

    logger.log('Bank transfer confirmation sent successfully:', result.messageId);
    return { success: true, emailId: result.messageId };
  } catch (error) {
    logger.error('Failed to send bank transfer confirmation:', error);
    return { success: false, error };
  }
}

export async function sendBankTransferExpiredEmail(data: ExpiredEmailData) {
  try {
    const emailHtml = await render(BankTransferExpiredEmail({
      customerName: data.customerName,
      referenceCode: data.referenceCode,
      holdCapturedAmount: data.holdCapturedAmount,
      holdCaptured: data.holdCaptured,
      marketLossAmount: data.marketLossAmount,
    }));

    const result = await sendEmail({
      to: data.customerEmail,
      subject: `Order Expired - ${data.referenceCode}`,
      html: emailHtml,
    });

    if (!result.success) {
      logger.error('Error sending bank transfer expired email:', result.error);
      return { success: false, error: result.error };
    }

    logger.log('Bank transfer expired email sent successfully:', result.messageId);
    return { success: true, emailId: result.messageId };
  } catch (error) {
    logger.error('Failed to send bank transfer expired email:', error);
    return { success: false, error };
  }
}

export async function sendAdminTransferNotification(data: AdminNotificationData) {
  try {
    const recipients = getComplianceAlertRecipients();
    if (recipients.length === 0) {
      logger.warn('No admin recipients configured for transfer notification');
      return { success: false, error: 'No admin recipients configured' };
    }

    const html = `
      <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">New Bank Transfer Order</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Reference</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${data.referenceCode}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Customer</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">A$${data.amountAud.toFixed(2)}</td>
          </tr>
          ${data.customerTransferRef ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Customer Transfer Ref</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.customerTransferRef}</td>
          </tr>
          ` : ''}
        </table>
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
          This order requires manual bank transfer reconciliation. Please monitor the bank account for the incoming payment.
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: recipients,
      subject: `[Admin] New Bank Transfer Order - ${data.referenceCode} - A$${data.amountAud.toFixed(2)}`,
      html,
    });

    if (!result.success) {
      logger.error('Error sending admin transfer notification:', result.error);
      return { success: false, error: result.error };
    }

    logger.log('Admin transfer notification sent successfully:', result.messageId);
    return { success: true, emailId: result.messageId };
  } catch (error) {
    logger.error('Failed to send admin transfer notification:', error);
    return { success: false, error };
  }
}
