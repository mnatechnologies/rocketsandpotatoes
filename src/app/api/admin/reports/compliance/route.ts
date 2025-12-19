import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger("COMPLIANCE_REPORTING_API");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Transaction metrics
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, amount, amount_aud, currency, created_at, requires_ttr')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('payment_status', 'succeeded');

    if (txError) throw txError;

    const totalTransactions = transactions?.length || 0;
    const totalValue = transactions?.reduce((sum, tx) => {
      const audAmount = tx.amount_aud || tx.amount;
      return sum + audAmount;
    }, 0) || 0;

    // Monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthTxs = transactions?.filter(tx => {
        const txMonth = new Date(tx.created_at).getMonth() + 1;
        return txMonth === month;
      }) || [];

      return {
        month: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
        count: monthTxs.length,
        value: monthTxs.reduce((sum, tx) => sum + (tx.amount_aud || tx.amount), 0),
      };
    });

    // TTR Reports
    const { count: ttrCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('requires_ttr', true)
      .not('ttr_submitted_at', 'is', null)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: pendingTtrCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('requires_ttr', true)
      .is('ttr_submitted_at', null)
      .not('ttr_reference', 'is', null)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Suspicious Activity Reports
    const { count: sarCount } = await supabase
      .from('suspicious_activity_reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: sarSubmitted } = await supabase
      .from('suspicious_activity_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Customer verification
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: verifiedCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Document reviews
    const { count: documentsReviewed } = await supabase
      .from('customer_documents')
      .select('*', { count: 'exact', head: true })
      .in('review_status', ['approved', 'rejected'])
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Staff training
    const { data: trainingRecords } = await supabase
      .from('staff_training')
      .select('staff_id, completion_status')
      .gte('training_date', startDate)
      .lte('training_date', endDate);

    const staffTrained = new Set(
      trainingRecords?.filter(t => t.completion_status === 'completed').map(t => t.staff_id)
    ).size;

    // EDD Investigations
    const { count: totalEDDInvestigations } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .gte('opened_at', startDate)
      .lte('opened_at', endDate);

    const { count: completedEDDInvestigations } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .not('completed_at', 'is', null)
      .gte('opened_at', startDate)
      .lte('opened_at', endDate);

    const { count: openEDDInvestigations } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .gte('opened_at', startDate)
      .lte('opened_at', endDate);

    const { count: awaitingInfoEDD } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'awaiting_customer_info')
      .gte('opened_at', startDate)
      .lte('opened_at', endDate);

    const { count: escalatedEDD } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'escalated')
      .gte('opened_at', startDate)
      .lte('opened_at', endDate);

    const { count: approvedEDD } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed_approved')
      .gte('opened_at', startDate)
      .lte('opened_at', endDate);

    const { count: rejectedEDD } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed_rejected')
      .gte('opened_at', startDate)
      .lte('opened_at', endDate);

    const { count: ongoingMonitoringEDD } = await supabase
      .from('edd_investigations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed_ongoing_monitoring')
      .gte('opened_at', startDate)
      .lte('opened_at', endDate);

    const verificationRate = totalCustomers && verifiedCustomers !== null
      ? ((verifiedCustomers / totalCustomers) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      success: true,
      year,
      data: {
        transactions: {
          total: totalTransactions,
          totalValue,
          monthly: monthlyData,
        },
        austracReports: {
          ttrsSubmitted: ttrCount || 0,
          ttrsPending: pendingTtrCount || 0,
          sarsTotal: sarCount || 0,
          sarsSubmitted: sarSubmitted || 0,
        },
        customerVerification: {
          totalCustomers: totalCustomers || 0,
          verifiedCustomers: verifiedCustomers || 0,
          verificationRate,
          documentsReviewed: documentsReviewed || 0,
        },
        staffTraining: {
          staffTrained,
          trainingSessionsCompleted: trainingRecords?.filter(t => t.completion_status === 'completed').length || 0,
        },
        eddInvestigations: {
          total: totalEDDInvestigations || 0,
          completed: completedEDDInvestigations || 0,
          open: openEDDInvestigations || 0,
          awaitingInfo: awaitingInfoEDD || 0,
          escalated: escalatedEDD || 0,
          approved: approvedEDD || 0,
          rejected: rejectedEDD || 0,
          ongoingMonitoring: ongoingMonitoringEDD || 0,
        },
      },
    });
  } catch (error: any) {
    logger.error('[COMPLIANCE_REPORT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate compliance report' }, { status: 500 });
  }
}
