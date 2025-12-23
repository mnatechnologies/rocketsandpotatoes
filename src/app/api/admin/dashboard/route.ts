import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { fetchFxRate } from '@/lib/metals-api/metalsApi';


const logger = createLogger('ADMIN_DASHBOARD_API');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    // Fetch pending document verifications
    const { data: pendingDocs, error: docsError } = await supabase
      .from('customer_documents')
      .select('id')
      .eq('review_status', 'pending');

    if (docsError) {
      logger.error('Error fetching pending documents:', docsError);
    }

    // Fetch flagged transactions
    const { data: flaggedTxs, error: txsError } = await supabase
      .from('transactions')
      .select(`
        *,
        customer:customers!inner(
          first_name,
          last_name,
          email,
          verification_status,
          risk_level,
          current_investigation_id
        )
      `)
      .eq('flagged_for_review', true)
      .or('review_status.is.null,review_status.eq.pending')
      .is('customer.current_investigation_id', null)
      .order('created_at', { ascending: false });

    if (txsError) {
      logger.error('Error fetching flagged transactions:', txsError);
    }

    // Fetch TTR-eligible transactions (only those with generated TTR references)
    const { data: ttrTransactions, error: ttrError } = await supabase
      .from('transactions')
      .select('id')
      .eq('requires_ttr', true)
      .not('ttr_reference', 'is', null)
      .is('ttr_submitted_at', null);

    if (ttrError) {
      logger.error('Error fetching TTR transactions:', ttrError);
    }

    // Fetch total customers
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (customersError) {
      logger.error('Error fetching customers count:', customersError);
    }

    // Fetch verified customers
    const { count: verifiedCustomers, error: verifiedError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    if (verifiedError) {
      logger.error('Error fetching verified customers:', verifiedError);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTransactions, error: recentTxError } = await supabase
      .from('transactions')
      .select('amount, amount_aud, currency, created_at')
      .eq('payment_status', 'succeeded')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (recentTxError) {
      logger.error('Error fetching recent transactions:', recentTxError);
    }

    // Get current FX rate for any USD transactions without amount_aud
    let usdToAudRate = 1.57; // Fallback
    try {
      const fxResult = await fetchFxRate('USD', 'AUD');
      usdToAudRate = fxResult.rate;
      logger.log(`Using current FX rate: ${usdToAudRate}`);
    } catch (error) {
      logger.error('Failed to fetch FX rate, using fallback:', error);
    }

    // Calculate total transaction value in AUD
    const totalTransactionValue = recentTransactions?.reduce((sum, tx) => {
      // Prefer stored amount_aud, otherwise convert using current rate
      const audAmount = tx.amount_aud || (tx.currency === 'USD' ? tx.amount * usdToAudRate : tx.amount);
      return sum + audAmount;
    }, 0) || 0;


    // Fetch suspicious activity reports
    const { count: suspiciousReports, error: sarError } = await supabase
      .from('suspicious_activity_reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'under_review']);

    if (sarError) {
      logger.error('Error fetching suspicious reports:', sarError);
    }

    // Fetch staff training compliance data
    const { data: activeStaff, error: staffError } = await supabase
      .from('staff')
      .select('id, requires_aml_training')
      .eq('is_active', true);

    if (staffError) {
      logger.error('Error fetching active staff:', staffError);
    }

    const staffRequiringTraining = activeStaff?.filter(s => s.requires_aml_training) || [];

    // Get overdue training
    const today = new Date().toISOString().split('T')[0];
    const { data: overdueTraining, error: overdueError } = await supabase
      .from('staff_training')
      .select('staff_id')
      .lt('next_training_due', today);

    if (overdueError) {
      logger.error('Error fetching overdue training:', overdueError);
    }

    // Get unique staff with overdue training
    const overdueStaffIds = new Set(overdueTraining?.map(t => t.staff_id) || []);
    const overdueStaffCount = overdueStaffIds.size;

    // Fetch active EDD investigations
    const { count: activeInvestigations, error: investigationsError } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated']);

    if (investigationsError) {
      logger.error('Error fetching active investigations:', investigationsError);
    }
    //fetch pending & escalated EDD reviews

    const { count: pendingEddReviews } = await supabase
        .from('customer_edd')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    const { count: escalatedEddReviews } = await supabase
        .from('customer_edd')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'escalated');

    return NextResponse.json({
      pendingDocuments: pendingDocs?.length || 0,
      flaggedTransactions: flaggedTxs?.length || 0,
      activeInvestigations: activeInvestigations || 0,
      pendingTTRs: ttrTransactions?.length || 0,
      totalCustomers: totalCustomers || 0,
      verifiedCustomers: verifiedCustomers || 0,
      recentTransactionsCount: recentTransactions?.length || 0,
      totalTransactionValue: totalTransactionValue,
      suspiciousReports: suspiciousReports || 0,
      staffRequiringTraining: staffRequiringTraining.length,
      overdueTraining: overdueStaffCount,
      eddReviewsPending: pendingEddReviews || 0,
      eddReviewsEscalated: escalatedEddReviews || 0,
    });
  } catch (error: any) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
