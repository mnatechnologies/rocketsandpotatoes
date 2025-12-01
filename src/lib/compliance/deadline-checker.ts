import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { getBusinessDaysRemaining } from './deadline-utils';
import { sendTTRDeadlineAlert, sendSMRDeadlineAlert } from '@/lib/email/sendComplianceAlert';

const logger = createLogger('DEADLINE_CHECKER');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface DeadlineCheckResult {
  ttrAlertsSent: number;
  smrAlertsSent: number;
  errors: string[];
}

/**
 * Check for TTRs with approaching deadlines and send alerts.
 * Alert thresholds:
 * - 5 days remaining: first warning
 * - 2 days remaining: urgent warning
 * - 1 day remaining: critical warning
 */
async function checkTTRDeadlines(): Promise<{ alertsSent: number; errors: string[] }> {
  const errors: string[] = [];
  let alertsSent = 0;

  try {
    // Get TTRs that require submission and haven't been submitted
    const { data: pendingTTRs, error } = await supabase
      .from('transactions')
      .select(`
        id,
        customer_id,
        amount,
        created_at,
        ttr_submission_deadline,
        ttr_reference,
        customers (
          first_name,
          last_name
        )
      `)
      .eq('requires_ttr', true)
      .is('ttr_submitted_at', null)
      .not('ttr_submission_deadline', 'is', null);

    if (error) {
      logger.error('Error fetching pending TTRs:', error);
      errors.push(`TTR fetch error: ${error.message}`);
      return { alertsSent, errors };
    }

    if (!pendingTTRs || pendingTTRs.length === 0) {
      logger.log('No pending TTRs found');
      return { alertsSent, errors };
    }

    logger.log(`Checking ${pendingTTRs.length} pending TTRs for deadline alerts`);

    for (const ttr of pendingTTRs) {
      const deadline = new Date(ttr.ttr_submission_deadline);
      const daysRemaining = getBusinessDaysRemaining(deadline);

      // Send alerts at specific thresholds: 5, 2, 1 days
      // Check if we should send an alert based on days remaining
      const shouldAlert = daysRemaining <= 5 && daysRemaining >= 0;

      if (!shouldAlert) continue;

      // Check if we already sent an alert today for this TTR
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAlert } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('entity_id', ttr.id)
        .eq('action_type', 'ttr_deadline_alert')
        .gte('created_at', `${today}T00:00:00Z`)
        .limit(1);

      if (existingAlert && existingAlert.length > 0) {
        // Already sent alert today for this TTR
        continue;
      }

      // Get customer name
      const customer = ttr.customers as { first_name?: string; last_name?: string } | null;
      const customerName = customer
        ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown';

      // Send alert
      const result = await sendTTRDeadlineAlert({
        transactionId: ttr.id,
        customerId: ttr.customer_id,
        customerName,
        transactionAmount: ttr.amount,
        transactionDate: new Date(ttr.created_at).toLocaleDateString('en-AU'),
        deadline: deadline.toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        daysRemaining,
      });

      if (result.success) {
        alertsSent++;
        
        // Log that we sent an alert
        await supabase.from('audit_logs').insert({
          action_type: 'ttr_deadline_alert',
          entity_type: 'transaction',
          entity_id: ttr.id,
          description: `TTR deadline alert sent: ${daysRemaining} days remaining`,
          metadata: {
            days_remaining: daysRemaining,
            deadline: ttr.ttr_submission_deadline,
          },
        });
      } else {
        errors.push(`Failed to send TTR alert for ${ttr.id}: ${result.error}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error checking TTR deadlines:', err);
    errors.push(`TTR check error: ${message}`);
  }

  return { alertsSent, errors };
}

/**
 * Check for SMRs with approaching deadlines and send alerts.
 * SMR deadline is 3 business days, so we alert at:
 * - 2 days remaining: warning
 * - 1 day remaining: urgent
 * - 0 days (due today): critical
 */
async function checkSMRDeadlines(): Promise<{ alertsSent: number; errors: string[] }> {
  const errors: string[] = [];
  let alertsSent = 0;

  try {
    // Get SMRs that are pending/under review and have deadlines
    const { data: pendingSMRs, error } = await supabase
      .from('suspicious_activity_reports')
      .select(`
        id,
        customer_id,
        suspicion_category,
        submission_deadline,
        created_at,
        customers (
          first_name,
          last_name
        )
      `)
      .in('status', ['pending', 'under_review'])
      .not('submission_deadline', 'is', null);

    if (error) {
      logger.error('Error fetching pending SMRs:', error);
      errors.push(`SMR fetch error: ${error.message}`);
      return { alertsSent, errors };
    }

    if (!pendingSMRs || pendingSMRs.length === 0) {
      logger.log('No pending SMRs found');
      return { alertsSent, errors };
    }

    logger.log(`Checking ${pendingSMRs.length} pending SMRs for deadline alerts`);

    for (const smr of pendingSMRs) {
      const deadline = new Date(smr.submission_deadline);
      const daysRemaining = getBusinessDaysRemaining(deadline);

      // SMRs have a 3-day deadline, so alert at 2, 1, 0 days
      const shouldAlert = daysRemaining <= 2 && daysRemaining >= 0;

      if (!shouldAlert) continue;

      // Check if we already sent an alert today for this SMR
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAlert } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('entity_id', smr.id)
        .eq('action_type', 'smr_deadline_alert')
        .gte('created_at', `${today}T00:00:00Z`)
        .limit(1);

      if (existingAlert && existingAlert.length > 0) {
        // Already sent alert today for this SMR
        continue;
      }

      // Get customer name
      const customer = smr.customers as { first_name?: string; last_name?: string } | null;
      const customerName = customer
        ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown';

      // Send alert
      const result = await sendSMRDeadlineAlert({
        smrId: smr.id,
        customerName,
        suspicionType: smr.suspicion_category,
        deadline: deadline.toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        daysRemaining,
      });

      if (result.success) {
        alertsSent++;
        
        // Log that we sent an alert
        await supabase.from('audit_logs').insert({
          action_type: 'smr_deadline_alert',
          entity_type: 'suspicious_activity_report',
          entity_id: smr.id,
          description: `SMR deadline alert sent: ${daysRemaining} days remaining`,
          metadata: {
            days_remaining: daysRemaining,
            deadline: smr.submission_deadline,
            suspicion_type: smr.suspicion_category,
          },
        });
      } else {
        errors.push(`Failed to send SMR alert for ${smr.id}: ${result.error}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error checking SMR deadlines:', err);
    errors.push(`SMR check error: ${message}`);
  }

  return { alertsSent, errors };
}

/**
 * Run all deadline checks and send alerts.
 * This should be called daily, ideally in the morning (e.g., 8 AM AEST).
 */
export async function runDeadlineChecks(): Promise<DeadlineCheckResult> {
  logger.log('Starting deadline checks...');

  const ttrResult = await checkTTRDeadlines();
  const smrResult = await checkSMRDeadlines();

  const result: DeadlineCheckResult = {
    ttrAlertsSent: ttrResult.alertsSent,
    smrAlertsSent: smrResult.alertsSent,
    errors: [...ttrResult.errors, ...smrResult.errors],
  };

  logger.log('Deadline checks complete:', {
    ttrAlerts: result.ttrAlertsSent,
    smrAlerts: result.smrAlertsSent,
    errorCount: result.errors.length,
  });

  // Log summary to audit
  await supabase.from('audit_logs').insert({
    action_type: 'deadline_check_run',
    entity_type: 'system',
    description: `Daily deadline check: ${result.ttrAlertsSent} TTR alerts, ${result.smrAlertsSent} SMR alerts`,
    metadata: result,
  });

  return result;
}

