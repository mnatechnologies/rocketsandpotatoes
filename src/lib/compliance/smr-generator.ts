import {createClient} from "@supabase/supabase-js";

export async function generateSMR(data: {
  customerId: string;
  transactionId?: string;
  suspicionType: 'structuring' | 'sanctions_match' | 'unusual_pattern' | 'high_risk' | 'other';
  indicators: string[];
  narrative: string;
}) {
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

  // Create SMR record
  const { data: smr, error } = await supabase
    .from('suspicious_activity_reports')
    .insert({
      customer_id: data.customerId,
      transaction_id: data.transactionId,
      report_type: 'SMR',
      suspicion_category: data.suspicionType,
      description: generateSMRNarrative(data),
      status: 'pending',
      flagged_by_system: true,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit event
  await supabase.from('audit_logs').insert({
    action_type: 'smr_created',
    entity_type: 'suspicious_activity_report',
    entity_id: smr.id,
    description: `SMR generated for ${data.suspicionType}`,
    metadata: {
      customer_id: data.customerId,
      transaction_id: data.transactionId,
      suspicion_type: data.suspicionType,
      indicators: data.indicators,
    },
  });

  return smr;
}

function generateSMRNarrative(data: any): string {
  return `
Suspicious Matter Report

Suspicion Type: ${data.suspicionType}
Indicators: ${data.indicators.join(', ')}

Narrative:
${data.narrative}

This matter was flagged by automated compliance systems and requires review within 3 business days.
  `.trim();
}