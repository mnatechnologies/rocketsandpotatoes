import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SES');

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  const fromEmail = from || process.env.SES_FROM_EMAIL;
  
  if (!fromEmail) {
    logger.error('SES_FROM_EMAIL environment variable is not set');
    return { success: false, error: 'SES_FROM_EMAIL not configured' };
  }

  const toAddresses = Array.isArray(to) ? to : [to];

  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(command);
    
    logger.log('Email sent successfully:', {
      messageId: response.MessageId,
      to: toAddresses,
      subject,
    });

    return { success: true, messageId: response.MessageId };
  } catch (error) {
    logger.error('Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * Get compliance alert email recipients from environment variable.
 * Format: COMPLIANCE_ALERT_EMAILS=email1@example.com,email2@example.com
 */
export function getComplianceAlertRecipients(): string[] {
  const emails = process.env.COMPLIANCE_ALERT_EMAILS || '';
  return emails
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
}









