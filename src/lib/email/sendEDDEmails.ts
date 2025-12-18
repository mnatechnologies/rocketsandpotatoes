import { sendEmail } from './ses';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('EDD_EMAILS');

interface EDDInvestigationOpenedProps {
  customerEmail: string;
  customerName: string;
  investigationNumber: string;
}

export async function sendEDDInvestigationOpenedEmail({
  customerEmail,
  customerName,
  investigationNumber,
}: EDDInvestigationOpenedProps) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Enhanced Due Diligence Review</h2>

      <p>Dear ${customerName},</p>

      <p>As part of our commitment to regulatory compliance and security, we have initiated an Enhanced Due Diligence review of your account.</p>

      <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Investigation Number:</strong> ${investigationNumber}</p>
      </div>

      <p>This is a standard procedure for certain transactions and does not necessarily indicate any issues with your account. Our compliance team will review your account details and may contact you if additional information is required.</p>

      <p>We appreciate your patience and cooperation during this process.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="color: #666; font-size: 12px;">
        Rockets & Potatoes<br>
        Precious Metals Trading
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: [customerEmail],
    subject: 'Enhanced Due Diligence Review - Account Notification',
    html,
  });

  if (result.success) {
    logger.log('EDD investigation opened email sent to:', customerEmail);
  } else {
    logger.error('Failed to send EDD investigation opened email:', result.error);
  }

  return result;
}

interface EDDInformationRequestProps {
  customerEmail: string;
  customerName: string;
  investigationNumber: string;
  requestedItems: string[];
  deadline?: string;
}

export async function sendEDDInformationRequestEmail({
  customerEmail,
  customerName,
  investigationNumber,
  requestedItems,
  deadline,
}: EDDInformationRequestProps) {
  const itemsList = requestedItems.map(item => `<li style="margin: 8px 0;">${item}</li>`).join('');
  const deadlineText = deadline ? `<p style="color: #d97706;"><strong>Response Deadline:</strong> ${deadline}</p>` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d97706;">Information Required - EDD Review</h2>

      <p>Dear ${customerName},</p>

      <p>As part of our Enhanced Due Diligence review, we require additional information to proceed with your account verification.</p>

      <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 16px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Investigation Number:</strong> ${investigationNumber}</p>
        ${deadlineText}
      </div>

      <p><strong>Please provide the following information:</strong></p>
      <ul style="color: #374151;">
        ${itemsList}
      </ul>

      <p>You can submit this information by replying to this email or contacting our compliance team at compliance@rocketsandpotatoes.com.</p>

      <p>Your prompt response will help us complete this review as quickly as possible.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="color: #666; font-size: 12px;">
        Rockets & Potatoes<br>
        Precious Metals Trading
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: [customerEmail],
    subject: 'Action Required - Information Needed for Account Review',
    html,
  });

  if (result.success) {
    logger.log('EDD information request email sent to:', customerEmail);
  } else {
    logger.error('Failed to send EDD information request email:', result.error);
  }

  return result;
}

interface EDDCompletionProps {
  customerEmail: string;
  customerName: string;
  investigationNumber: string;
  decision: 'approved' | 'ongoing_monitoring' | 'enhanced_monitoring' | 'blocked';
}

export async function sendEDDCompletionEmail({
  customerEmail,
  customerName,
  investigationNumber,
  decision,
}: EDDCompletionProps) {
  const decisionConfig = {
    approved: {
      color: '#16a34a',
      bg: '#f0fdf4',
      title: '✅ Account Review Completed - Approved',
      message: 'Your Enhanced Due Diligence review has been completed successfully. Your account is now fully verified and you may proceed with transactions.',
    },
    ongoing_monitoring: {
      color: '#2563eb',
      bg: '#eff6ff',
      title: 'Account Review Completed - Ongoing Monitoring',
      message: 'Your Enhanced Due Diligence review has been completed. Your account will be subject to ongoing monitoring as part of our standard compliance procedures.',
    },
    enhanced_monitoring: {
      color: '#d97706',
      bg: '#fffbeb',
      title: 'Account Review Completed - Enhanced Monitoring',
      message: 'Your Enhanced Due Diligence review has been completed. Your account will be subject to enhanced monitoring and may require additional verification for certain transactions.',
    },
    blocked: {
      color: '#dc2626',
      bg: '#fef2f2',
      title: 'Account Review Completed',
      message: 'After careful review, we are unable to approve your account at this time. If you believe this decision was made in error, please contact our compliance team.',
    },
  };

  const config = decisionConfig[decision];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${config.color};">${config.title}</h2>

      <p>Dear ${customerName},</p>

      <p>${config.message}</p>

      <div style="background-color: ${config.bg}; border-left: 4px solid ${config.color}; padding: 16px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Investigation Number:</strong> ${investigationNumber}</p>
        <p style="margin: 8px 0 0 0;"><strong>Decision:</strong> ${decision.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
      </div>

      <p>If you have any questions regarding this decision, please contact our compliance team at compliance@rocketsandpotatoes.com.</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="color: #666; font-size: 12px;">
        Rockets & Potatoes<br>
        Precious Metals Trading
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: [customerEmail],
    subject: config.title,
    html,
  });

  if (result.success) {
    logger.log('EDD completion email sent to:', customerEmail, 'Decision:', decision);
  } else {
    logger.error('Failed to send EDD completion email:', result.error);
  }

  return result;
}
