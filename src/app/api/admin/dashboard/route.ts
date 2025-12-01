import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';

const logger = createLogger('ADMIN_DASHBOARD_API');

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
      .select('id, review_status')
      .eq('flagged_for_review', true)
      .or('review_status.is.null,review_status.eq.pending');

    if (txsError) {
      logger.error('Error fetching flagged transactions:', txsError);
    }

    // Fetch TTR-eligible transactions
    const { data: ttrTransactions, error: ttrError } = await supabase
      .from('transactions')
      .select('id')
      .eq('requires_ttr', true)
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

    // Fetch recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTransactions, error: recentTxError } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (recentTxError) {
      logger.error('Error fetching recent transactions:', recentTxError);
    }

    // Calculate total transaction value
    const totalTransactionValue = recentTransactions?.reduce(
      (sum, tx) => sum + parseFloat(tx.amount.toString()),
      0
    ) || 0;

    // Fetch suspicious activity reports
    const { count: suspiciousReports, error: sarError } = await supabase
      .from('suspicious_activity_reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'under_review']);

    if (sarError) {
      logger.error('Error fetching suspicious reports:', sarError);
    }

    return NextResponse.json({
      pendingDocuments: pendingDocs?.length || 0,
      flaggedTransactions: flaggedTxs?.length || 0,
      pendingTTRs: ttrTransactions?.length || 0,
      totalCustomers: totalCustomers || 0,
      verifiedCustomers: verifiedCustomers || 0,
      recentTransactionsCount: recentTransactions?.length || 0,
      totalTransactionValue: totalTransactionValue,
      suspiciousReports: suspiciousReports || 0,
    });
  } catch (error: any) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
