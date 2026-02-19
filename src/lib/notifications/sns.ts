import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SNS');

const snsClient = new SNSClient({
  region: process.env.AWS_SNS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Get admin alert phone numbers from environment variable.
 * Format: ADMIN_ALERT_PHONES=+61400000001,+61400000002 (E.164 format)
 */
export function getAdminAlertPhones(): string[] {
  const phones = process.env.ADMIN_ALERT_PHONES || '';
  return phones
    .split(',')
    .map(phone => phone.trim())
    .filter(phone => phone.length > 0);
}

/**
 * Send an SMS message via AWS SNS to a single phone number.
 */
function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    logger.warn('AWS credentials not configured, skipping SMS');
    return { success: false, error: 'AWS credentials not configured' };
  }

  try {
    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    });

    const response = await snsClient.send(command);

    logger.log('SMS sent successfully:', {
      messageId: response.MessageId,
      phoneNumber: maskPhone(phoneNumber),
    });

    return { success: true, messageId: response.MessageId };
  } catch (error) {
    logger.error('Failed to send SMS:', error);
    return { success: false, error };
  }
}

/**
 * Send an SMS to all admin alert phone numbers.
 */
export async function sendAdminAlertSMS(
  message: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  const phones = getAdminAlertPhones();

  if (phones.length === 0) {
    logger.warn('No admin alert phone numbers configured (ADMIN_ALERT_PHONES)');
    return { success: true, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const phone of phones) {
    const result = await sendSMS(phone, message);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { success: failed === 0, sent, failed };
}
