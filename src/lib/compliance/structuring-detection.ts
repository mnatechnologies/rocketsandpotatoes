import { createClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/utils/logger";
import { sendComplianceAlert } from "@/lib/email/sendComplianceAlert";

const logger = createLogger('STRUCTURING_DETECTION');

// Configurable detection parameters
const DETECTION_CONFIG = {
  // Rolling window for transaction analysis (30 days per audit recommendation)
  windowDays: 30,
  // Threshold bands — detect transactions clustered just below any compliance threshold
  thresholds: [
    { name: 'KYC', limit: 5000, bandFloor: 3500, minCount: 3 },
    { name: 'TTR', limit: 10000, bandFloor: 7000, minCount: 2 },
    { name: 'EDD', limit: 50000, bandFloor: 40000, minCount: 2 },
  ],
  // Same-day clustering: flag N+ transactions on same day just under any threshold
  sameDayClusterMin: 2,
} as const;

interface StructuringFlag {
  detected: boolean;
  indicators: string[];
  narrative: string;
  totalAmount: number;
  thresholdName: string;
}

/**
 * Detect potential structuring patterns.
 * IMPORTANT: This function FLAGS suspicious patterns for AMLCO review.
 * It does NOT auto-file SMRs — a human must form the suspicion and decide to file.
 */
export async function detectStructuring(
  customerId: string,
  currentAmount: number,
): Promise<boolean> {
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

  const windowStart = new Date(
    Date.now() - DETECTION_CONFIG.windowDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('amount_aud, amount, created_at')
    .eq('customer_id', customerId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false });

  if (!recentTransactions || recentTransactions.length === 0) return false;

  const totalRecent = recentTransactions.reduce(
    (sum, tx) => sum + (tx.amount_aud || 0), 0
  );

  const flags: StructuringFlag[] = [];

  // Check each threshold band
  for (const threshold of DETECTION_CONFIG.thresholds) {
    const bandTransactions = recentTransactions.filter(
      tx => tx.amount_aud >= threshold.bandFloor && tx.amount_aud < threshold.limit
    );

    if (bandTransactions.length >= threshold.minCount) {
      flags.push({
        detected: true,
        thresholdName: threshold.name,
        indicators: [
          `${bandTransactions.length} transactions between $${threshold.bandFloor.toLocaleString()}-$${threshold.limit.toLocaleString()} in ${DETECTION_CONFIG.windowDays} days`,
          `Total recent amount: $${totalRecent.toFixed(2)}`,
          `Current transaction: $${currentAmount.toFixed(2)}`,
        ],
        narrative: `Customer may be structuring transactions to avoid $${threshold.limit.toLocaleString()} ${threshold.name} threshold`,
        totalAmount: totalRecent + currentAmount,
      });
    }

    // Same-day clustering just under threshold
    const txByDay = new Map<string, number>();
    for (const tx of bandTransactions) {
      const day = new Date(tx.created_at).toISOString().split('T')[0];
      txByDay.set(day, (txByDay.get(day) || 0) + 1);
    }
    for (const [day, count] of txByDay) {
      if (count >= DETECTION_CONFIG.sameDayClusterMin) {
        flags.push({
          detected: true,
          thresholdName: threshold.name,
          indicators: [
            `${count} transactions on ${day} just below $${threshold.limit.toLocaleString()} ${threshold.name} threshold`,
          ],
          narrative: `Multiple same-day transactions clustered below ${threshold.name} threshold — potential structuring`,
          totalAmount: totalRecent + currentAmount,
        });
      }
    }
  }

  if (flags.length === 0) return false;

  // Create a PENDING REVIEW record — NOT an auto-filed SMR
  // The AMLCO must review this flag, form a suspicion, and decide whether to file
  const { error: flagError } = await supabase
    .from('suspicious_activity_reports')
    .insert({
      customer_id: customerId,
      report_type: 'SMR',
      suspicion_category: 'structuring',
      description: formatReviewNarrative(flags),
      transaction_amount_aud: flags[0].totalAmount,
      status: 'pending_review', // Requires AMLCO review before filing
      flagged_by_system: true,
      submission_deadline: null, // Deadline starts when AMLCO forms suspicion, not when system flags
    });

  if (flagError) {
    logger.error('Failed to create structuring review flag:', flagError);
    return true; // Still return true to block the transaction
  }

  // Send alert to AMLCO for review
  try {
    await sendComplianceAlert({
      type: 'structuring_flag',
      severity: 'high',
      title: `Structuring review required — Customer ${customerId}`,
      description: formatReviewNarrative(flags) +
        '\n\nAction required: Review this flag in the admin compliance queue. ' +
        'If you form a suspicion, approve the SMR for filing. ' +
        'The 3-business-day deadline begins when you confirm the suspicion.',
    });
  } catch (alertErr) {
    logger.error('Failed to send structuring review alert:', alertErr);
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action_type: 'structuring_flag_created',
    entity_type: 'customer',
    entity_id: customerId,
    description: `System flagged potential structuring — awaiting AMLCO review`,
    metadata: {
      flags: flags.map(f => ({
        threshold: f.thresholdName,
        indicators: f.indicators,
      })),
      total_amount: totalRecent + currentAmount,
      current_transaction: currentAmount,
      window_days: DETECTION_CONFIG.windowDays,
    },
  });

  logger.log(`📋 Structuring flag created for customer ${customerId} — awaiting AMLCO review`);
  return true;
}

function formatReviewNarrative(flags: StructuringFlag[]): string {
  const lines = [
    'SYSTEM-FLAGGED POTENTIAL STRUCTURING — AWAITING AMLCO REVIEW',
    '',
    'This is an automated flag. An SMR has NOT been filed.',
    'The AMLCO must review the indicators below and determine whether a suspicion is formed.',
    '',
    'Detected patterns:',
  ];

  for (const flag of flags) {
    lines.push(`\n[${flag.thresholdName} Threshold]`);
    lines.push(flag.narrative);
    for (const indicator of flag.indicators) {
      lines.push(`  • ${indicator}`);
    }
  }

  return lines.join('\n');
}

