import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rescreenAllCustomers } from '@/lib/compliance/screening';
import { generateSMR } from '@/lib/compliance/smr-generator';
import { sendSanctionsMatchAlert } from '@/lib/email/sendComplianceAlert';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CRON_RESCREEN_CUSTOMERS');

export async function GET(req: NextRequest) {
  // Security check for cron jobs
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized cron job access attempt.');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  logger.log('Weekly customer re-screening cron job started...');

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

  try {
    // Perform re-screening of all customers
    const result = await rescreenAllCustomers();

    // For each new match, generate SMR and send alert
    for (const customerId of result.matchedCustomerIds) {
      try {
        // Get customer details for alert
        const { data: customer } = await supabase
          .from('customers')
          .select('first_name, last_name')
          .eq('id', customerId)
          .single();

        const customerName = customer
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : 'Unknown';

        // Generate SMR for the match
        await generateSMR({
          customerId,
          suspicionType: 'sanctions_match',
          indicators: ['Matched during weekly re-screening'],
          narrative: `Customer ${customerName} matched against sanctions list during periodic re-screening. Requires immediate review.`,
        });

        // Get the latest screening result for alert details
        const { data: screeningResult } = await supabase
          .from('sanctions_screenings')
          .select('matched_entities')
          .eq('customer_id', customerId)
          .order('screened_at', { ascending: false })
          .limit(1)
          .single();

        // Send alert
        await sendSanctionsMatchAlert({
          customerId,
          customerName,
          matchedEntities: (screeningResult?.matched_entities || []).map((m: { name: string; source: string; referenceNumber: string }) => ({
            name: m.name,
            source: m.source,
            referenceNumber: m.referenceNumber,
          })),
        });

        logger.log(`SMR generated and alert sent for customer ${customerId}`);
      } catch (alertError) {
        logger.error(`Failed to process new match for customer ${customerId}:`, alertError);
      }
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action_type: 'weekly_rescreen_completed',
      entity_type: 'system',
      description: `Weekly sanctions re-screening: ${result.screened} customers screened, ${result.newMatches} new matches`,
      metadata: {
        total_customers: result.totalCustomers,
        screened: result.screened,
        new_matches: result.newMatches,
        errors: result.errors,
        matched_customer_ids: result.matchedCustomerIds,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Weekly re-screening completed',
      result: {
        totalCustomers: result.totalCustomers,
        screened: result.screened,
        newMatches: result.newMatches,
        errors: result.errors,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Weekly re-screening cron job failed:', error);

    // Log failure audit event
    await supabase.from('audit_logs').insert({
      action_type: 'weekly_rescreen_failed',
      entity_type: 'system',
      description: `Weekly sanctions re-screening failed: ${message}`,
      metadata: { error: message },
    });

    return NextResponse.json(
      { success: false, message: 'Re-screening failed', error: message },
      { status: 500 }
    );
  }
}






