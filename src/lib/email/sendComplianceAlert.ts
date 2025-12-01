import { render } from '@react-email/render';
import ComplianceAlertEmail, { AlertType } from '@/emails/ComplianceAlertEmail';
import { createLogger } from '@/lib/utils/logger';
import { sendEmail, getComplianceAlertRecipients } from './ses';

const logger = createLogger('COMPLIANCE_ALERT');

interface SanctionsMatchAlertData {
  customerId: string;
  customerName: string;
  matchedEntity: string;
  matchScore: number;
  source: string;
  transactionAmount?: number;
}

interface SMRCreatedAlertData {
  smrId: string;
  customerId: string;
  customerName: string;
  suspicionType: string;
  transactionAmount?: number;
  deadline: string;
}

interface TTRDeadlineAlertData {
  transactionId: string;
  customerId: string;
  customerName: string;
  transactionAmount: number;
  transactionDate: string;
  deadline: string;
  daysRemaining: number;
}

interface TransactionFlaggedAlertData {
  transactionId: string;
  customerId: string;
  customerName: string;
  transactionAmount: number;
  flagReason: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function sendSanctionsMatchAlert(data: SanctionsMatchAlertData) {
  const recipients = getComplianceAlertRecipients();
  
  if (recipients.length === 0) {
    logger.error('No compliance alert recipients configured (COMPLIANCE_ALERT_EMAILS)');
    return { success: false, error: 'No recipients configured' };
  }

  const emailHtml = await render(
    ComplianceAlertEmail({
      alertType: 'sanctions_match',
      title: 'SANCTIONS MATCH DETECTED',
      severity: 'critical',
      summary: `A customer has matched against a sanctions list. All transactions have been blocked pending review.`,
      details: [
        { label: 'Customer ID', value: data.customerId },
        { label: 'Customer Name', value: data.customerName },
        { label: 'Matched Entity', value: data.matchedEntity },
        { label: 'Match Score', value: `${(data.matchScore * 100).toFixed(0)}%` },
        { label: 'Source', value: data.source },
        ...(data.transactionAmount ? [{ label: 'Transaction Amount', value: `$${data.transactionAmount.toLocaleString()} AUD` }] : []),
      ],
      actionRequired: 'Immediately review this sanctions match. Verify if this is a true match or false positive. If confirmed, file an SMR with AUSTRAC and maintain transaction block.',
      adminUrl: `${baseUrl}/admin/reviews`,
    })
  );

  const result = await sendEmail({
    to: recipients,
    subject: '🚨 CRITICAL: Sanctions Match Detected - Immediate Action Required',
    html: emailHtml,
  });

  if (result.success) {
    logger.log('Sanctions match alert sent successfully');
  } else {
    logger.error('Failed to send sanctions match alert:', result.error);
  }

  return result;
}

export async function sendSMRCreatedAlert(data: SMRCreatedAlertData) {
  const recipients = getComplianceAlertRecipients();
  
  if (recipients.length === 0) {
    logger.error('No compliance alert recipients configured (COMPLIANCE_ALERT_EMAILS)');
    return { success: false, error: 'No recipients configured' };
  }

  const emailHtml = await render(
    ComplianceAlertEmail({
      alertType: 'smr_created',
      title: 'Suspicious Matter Report Created',
      severity: 'high',
      summary: `A new SMR has been generated and requires review before submission to AUSTRAC.`,
      details: [
        { label: 'SMR ID', value: data.smrId },
        { label: 'Customer ID', value: data.customerId },
        { label: 'Customer Name', value: data.customerName },
        { label: 'Suspicion Type', value: data.suspicionType },
        ...(data.transactionAmount ? [{ label: 'Transaction Amount', value: `$${data.transactionAmount.toLocaleString()} AUD` }] : []),
      ],
      actionRequired: 'Review this SMR and submit to AUSTRAC within the deadline. Ensure all required information is complete and accurate.',
      deadline: data.deadline,
      adminUrl: `${baseUrl}/admin/smr-reports`,
    })
  );

  const result = await sendEmail({
    to: recipients,
    subject: `⚠️ New SMR Created - ${data.suspicionType} - Review Required`,
    html: emailHtml,
  });

  if (result.success) {
    logger.log('SMR created alert sent successfully');
  } else {
    logger.error('Failed to send SMR created alert:', result.error);
  }

  return result;
}

export async function sendTTRDeadlineAlert(data: TTRDeadlineAlertData) {
  const recipients = getComplianceAlertRecipients();
  
  if (recipients.length === 0) {
    logger.error('No compliance alert recipients configured (COMPLIANCE_ALERT_EMAILS)');
    return { success: false, error: 'No recipients configured' };
  }

  const severity = data.daysRemaining <= 2 ? 'critical' : data.daysRemaining <= 5 ? 'high' : 'medium';

  const emailHtml = await render(
    ComplianceAlertEmail({
      alertType: 'ttr_deadline',
      title: 'TTR Submission Deadline Approaching',
      severity,
      summary: `A Threshold Transaction Report is due for submission to AUSTRAC. ${data.daysRemaining} business day(s) remaining.`,
      details: [
        { label: 'Transaction ID', value: data.transactionId },
        { label: 'Customer Name', value: data.customerName },
        { label: 'Transaction Amount', value: `$${data.transactionAmount.toLocaleString()} AUD` },
        { label: 'Transaction Date', value: data.transactionDate },
        { label: 'Days Remaining', value: `${data.daysRemaining} business day(s)` },
      ],
      actionRequired: 'Export and submit this TTR to AUSTRAC Online before the deadline.',
      deadline: data.deadline,
      adminUrl: `${baseUrl}/admin/ttr-reports`,
    })
  );

  const result = await sendEmail({
    to: recipients,
    subject: `${data.daysRemaining <= 2 ? '🚨' : '⏰'} TTR Deadline: ${data.daysRemaining} day(s) remaining`,
    html: emailHtml,
  });

  if (result.success) {
    logger.log('TTR deadline alert sent successfully');
  } else {
    logger.error('Failed to send TTR deadline alert:', result.error);
  }

  return result;
}

export async function sendTransactionFlaggedAlert(data: TransactionFlaggedAlertData) {
  const recipients = getComplianceAlertRecipients();
  
  if (recipients.length === 0) {
    logger.error('No compliance alert recipients configured (COMPLIANCE_ALERT_EMAILS)');
    return { success: false, error: 'No recipients configured' };
  }

  const emailHtml = await render(
    ComplianceAlertEmail({
      alertType: 'transaction_flagged',
      title: 'Transaction Flagged for Review',
      severity: 'medium',
      summary: `A transaction has been flagged for manual compliance review.`,
      details: [
        { label: 'Transaction ID', value: data.transactionId },
        { label: 'Customer ID', value: data.customerId },
        { label: 'Customer Name', value: data.customerName },
        { label: 'Transaction Amount', value: `$${data.transactionAmount.toLocaleString()} AUD` },
        { label: 'Flag Reason', value: data.flagReason },
      ],
      actionRequired: 'Review this transaction and approve or reject based on your compliance assessment.',
      adminUrl: `${baseUrl}/admin/reviews`,
    })
  );

  const result = await sendEmail({
    to: recipients,
    subject: `📋 Transaction Flagged: ${data.flagReason}`,
    html: emailHtml,
  });

  if (result.success) {
    logger.log('Transaction flagged alert sent successfully');
  } else {
    logger.error('Failed to send transaction flagged alert:', result.error);
  }

  return result;
}

export async function sendSMRDeadlineAlert(data: {
  smrId: string;
  customerName: string;
  suspicionType: string;
  deadline: string;
  daysRemaining: number;
}) {
  const recipients = getComplianceAlertRecipients();
  
  if (recipients.length === 0) {
    logger.error('No compliance alert recipients configured (COMPLIANCE_ALERT_EMAILS)');
    return { success: false, error: 'No recipients configured' };
  }

  const severity = data.daysRemaining <= 1 ? 'critical' : 'high';

  const emailHtml = await render(
    ComplianceAlertEmail({
      alertType: 'smr_deadline',
      title: 'SMR Submission Deadline Approaching',
      severity,
      summary: `A Suspicious Matter Report must be submitted to AUSTRAC. ${data.daysRemaining} business day(s) remaining.`,
      details: [
        { label: 'SMR ID', value: data.smrId },
        { label: 'Customer Name', value: data.customerName },
        { label: 'Suspicion Type', value: data.suspicionType },
        { label: 'Days Remaining', value: `${data.daysRemaining} business day(s)` },
      ],
      actionRequired: 'Submit this SMR to AUSTRAC immediately. Failure to report within 3 business days may result in regulatory penalties.',
      deadline: data.deadline,
      adminUrl: `${baseUrl}/admin/smr-reports`,
    })
  );

  const result = await sendEmail({
    to: recipients,
    subject: `🚨 URGENT: SMR Deadline - ${data.daysRemaining} day(s) remaining`,
    html: emailHtml,
  });

  if (result.success) {
    logger.log('SMR deadline alert sent successfully');
  } else {
    logger.error('Failed to send SMR deadline alert:', result.error);
  }

  return result;
}






