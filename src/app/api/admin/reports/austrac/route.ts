import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'all'; // 'ttr', 'sar', 'all'
    const status = searchParams.get('status'); // 'pending', 'submitted'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search'); // Search by reference/customer

    let ttrs: any[] = [];
    let sars: any[] = [];

    // Fetch TTRs
    if (reportType === 'all' || reportType === 'ttr') {
      let ttrQuery = supabase
        .from('transactions')
        .select(`
          id,
          amount,
          amount_aud,
          currency,
          created_at,
          ttr_reference,
          ttr_submitted_at,
          customer_id,
          customers (
            first_name,
            email
          )
        `)
        .eq('requires_ttr', true)
        .not('ttr_reference', 'is', null);

      // Filter by status
      if (status === 'pending') {
        ttrQuery = ttrQuery.is('ttr_submitted_at', null);
      } else if (status === 'submitted') {
        ttrQuery = ttrQuery.not('ttr_submitted_at', 'is', null);
      }

      // Filter by date range
      if (startDate) {
        ttrQuery = ttrQuery.gte('created_at', startDate);
      }
      if (endDate) {
        ttrQuery = ttrQuery.lte('created_at', endDate);
      }

      const { data: ttrData, error: ttrError } = await ttrQuery.order('created_at', { ascending: false });

      if (ttrError) throw ttrError;

      ttrs = ttrData?.map((tx: any) => ({
        type: 'TTR',
        reference: tx.ttr_reference,
        date: tx.created_at,
        submittedAt: tx.ttr_submitted_at,
        status: tx.ttr_submitted_at ? 'submitted' : 'pending',
        amount: tx.amount_aud || tx.amount,
        currency: tx.currency,
        customerName: tx.customers?.first_name || 'Unknown',
        customerEmail: tx.customers?.email || '',
        transactionId: tx.id,
      })) || [];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        ttrs = ttrs.filter(t =>
          t.reference?.toLowerCase().includes(searchLower) ||
          t.customerName?.toLowerCase().includes(searchLower) ||
          t.customerEmail?.toLowerCase().includes(searchLower)
        );
      }
    }

    // Fetch SARs (Suspicious Activity Reports)
    if (reportType === 'all' || reportType === 'sar') {
      let sarQuery = supabase
        .from('suspicious_activity_reports')
        .select(`
          id,
          austrac_reference,
          report_type,
          status,
          created_at,
          austrac_submitted_at,
          customer_id,
          transaction_id,
          transaction_amount_aud,
          customers (
            first_name,
            email
          )
        `);

      // Filter by status
      if (status) {
        // Map 'submitted' to 'reported' for SAR table
        const sarStatus = status === 'submitted' ? 'reported' : status;
        sarQuery = sarQuery.eq('status', sarStatus);
      }

      // Filter by date range
      if (startDate) {
        sarQuery = sarQuery.gte('created_at', startDate);
      }
      if (endDate) {
        sarQuery = sarQuery.lte('created_at', endDate);
      }

      const { data: sarData, error: sarError } = await sarQuery.order('created_at', { ascending: false });

      if (sarError) throw sarError;

      sars = sarData?.map((sar: any) => ({
        type: 'SAR',
        reference: sar.austrac_reference,
        date: sar.created_at,
        submittedAt: sar.austrac_submitted_at,
        status: sar.status === 'reported' ? 'submitted' : sar.status,
        reportType: sar.report_type,
        customerName: sar.customers?.first_name || 'Unknown',
        customerEmail: sar.customers?.email || '',
        reportId: sar.id,
        amount: sar.transaction_amount_aud,
      })) || [];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        sars = sars.filter(s =>
          s.reference?.toLowerCase().includes(searchLower) ||
          s.customerName?.toLowerCase().includes(searchLower) ||
          s.customerEmail?.toLowerCase().includes(searchLower)
        );
      }
    }

    // Combine and sort all reports
    const allReports = [...ttrs, ...sars].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: allReports,
      summary: {
        total: allReports.length,
        ttrs: ttrs.length,
        sars: sars.length,
        pending: allReports.filter(r => r.status === 'pending').length,
        submitted: allReports.filter(r => r.status === 'submitted').length,
      },
    });
  } catch (error: any) {
    console.error('[AUSTRAC_TRACKER_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch AUSTRAC reports' }, { status: 500 });
  }
}
