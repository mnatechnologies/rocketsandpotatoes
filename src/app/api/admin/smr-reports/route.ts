import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/utils/logger';
import { getBusinessDaysRemaining, formatDeadline, calculateSMRDeadline } from '@/lib/compliance/deadline-utils';

const logger = createLogger('SMR_REPORTS_API');

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

export interface SMRRecord {
  id: string;
  customer_id: string;
  transaction_id: string | null;
  report_type: string;
  suspicion_category: string;
  description: string;
  status: string;
  flagged_by_system: boolean;
  austrac_submitted_at: string | null;
  austrac_reference: string | null;
  submission_deadline: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  transaction_amount: number | null;
  days_remaining: number | null;
}

// GET - Fetch SMR records
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const format = searchParams.get('format') || 'json';

    let query = supabase
      .from('suspicious_activity_reports')
      .select(`
        *,
        customer:customers (
          first_name,
          last_name,
          email
        ),
        transaction:transactions (
          amount,
          currency
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by status
    if (status === 'pending') {
      query = query.in('status', ['pending', 'pending_review', 'under_review']);
    } else if (status === 'submitted') {
      query = query.eq('status', 'reported');
    } else if (status === 'dismissed') {
      query = query.eq('status', 'dismissed');
    }
    // 'all' fetches everything

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching SMR records:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format records
    const records: SMRRecord[] = (data || []).map((smr: any) => {
      const deadline = smr.submission_deadline ? new Date(smr.submission_deadline) : null;
      const daysRemaining = deadline ? getBusinessDaysRemaining(deadline) : null;

      return {
        id: smr.id,
        customer_id: smr.customer_id,
        transaction_id: smr.transaction_id,
        report_type: smr.report_type,
        suspicion_category: smr.suspicion_category,
        description: smr.description,
        status: smr.status,
        flagged_by_system: smr.flagged_by_system,
        austrac_submitted_at: smr.austrac_submitted_at,
        austrac_reference: smr.austrac_reference,
        submission_deadline: smr.submission_deadline,
        created_at: smr.created_at,
        customer_name: smr.customer
          ? `${smr.customer.first_name || ''} ${smr.customer.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown',
        customer_email: smr.customer?.email || 'N/A',
        transaction_amount: smr.transaction?.amount || null,
        days_remaining: daysRemaining,
      };
    });

    // Return as CSV if requested
    if (format === 'csv') {
      const csv = exportSMRsAsCSV(records);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="SMR_Report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      message: 'SMR reports retrieved successfully',
      count: records.length,
      records,
    });
  } catch (error: any) {
    logger.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch SMR reports' },
      { status: 500 }
    );
  }
}

// POST - Update SMR status
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { smrIds, action, austracReference, notes, suspicionRationale } = await req.json();

    if (!smrIds || !Array.isArray(smrIds) || smrIds.length === 0) {
      return NextResponse.json(
        { error: 'SMR IDs are required' },
        { status: 400 }
      );
    }

    if (action === 'mark_submitted') {
      // Mark as submitted to AUSTRAC
      // Guard: only AMLCO-confirmed SMRs can be filed (not pending_review)
      const { error } = await supabase
        .from('suspicious_activity_reports')
        .update({
          status: 'reported',
          austrac_submitted_at: new Date().toISOString(),
          austrac_reference: austracReference || null,
        })
        .in('id', smrIds)
        .in('status', ['pending', 'under_review']);

      if (error) {
        logger.error('Error marking SMRs as submitted:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log audit event
      for (const smrId of smrIds) {
        await supabase.from('audit_logs').insert({
          action_type: 'smr_submitted',
          entity_type: 'suspicious_activity_report',
          entity_id: smrId,
          description: `SMR submitted to AUSTRAC${austracReference ? ` (Ref: ${austracReference})` : ''}`,
          metadata: {
            austrac_reference: austracReference,
            submitted_by: adminCheck.userId,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `${smrIds.length} SMR(s) marked as submitted`,
      });
    }

    // AMLCO confirms suspicion: transitions pending_review → pending with deadline
    // This is the critical human-in-the-loop step: the 3-business-day clock starts NOW
    if (action === 'confirm_suspicion') {
      if (!suspicionRationale?.trim()) {
        return NextResponse.json(
          { error: 'Suspicion rationale is required — document why you formed the suspicion' },
          { status: 400 }
        );
      }

      // Calculate deadline: 3 business days from NOW (when suspicion is formed)
      const deadline = calculateSMRDeadline(new Date());

      const { error } = await supabase
        .from('suspicious_activity_reports')
        .update({
          status: 'pending',
          submission_deadline: deadline.toISOString(),
        })
        .in('id', smrIds)
        .in('status', ['pending_review']); // Only transition from pending_review

      if (error) {
        logger.error('Error confirming suspicion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Audit log with both timestamps for regulatory defensibility
      // Self-contained: includes system flag time so audit trail doesn't require cross-referencing
      for (const smrId of smrIds) {
        // Fetch the original SMR created_at for the system flag timestamp
        const { data: smrRecord } = await supabase
          .from('suspicious_activity_reports')
          .select('created_at')
          .eq('id', smrId)
          .single();

        await supabase.from('audit_logs').insert({
          action_type: 'smr_suspicion_confirmed',
          entity_type: 'suspicious_activity_report',
          entity_id: smrId,
          description: `AMLCO confirmed suspicion. Rationale: ${suspicionRationale}. Filing deadline: ${deadline.toISOString()}`,
          metadata: {
            confirmed_by: adminCheck.userId,
            suspicion_rationale: suspicionRationale,
            system_flagged_at: smrRecord?.created_at || null,
            suspicion_formed_at: new Date().toISOString(),
            submission_deadline: deadline.toISOString(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Suspicion confirmed for ${smrIds.length} SMR(s). Filing deadline: ${deadline.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        deadline: deadline.toISOString(),
      });
    }

    if (action === 'mark_under_review') {
      const { error } = await supabase
        .from('suspicious_activity_reports')
        .update({ status: 'under_review' })
        .in('id', smrIds);

      if (error) {
        logger.error('Error updating SMR status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `${smrIds.length} SMR(s) marked as under review`,
      });
    }

    if (action === 'dismiss') {
      if (!notes) {
        return NextResponse.json(
          { error: 'Dismissal notes are required' },
          { status: 400 }
        );
      }

      // Fetch current descriptions, append dismissal reason, then update
      for (const smrId of smrIds) {
        const { data: current } = await supabase
          .from('suspicious_activity_reports')
          .select('description')
          .eq('id', smrId)
          .single();

        const updatedDescription = (current?.description || '') +
          `\n\n--- DISMISSED ---\nReason: ${notes}`;

        await supabase
          .from('suspicious_activity_reports')
          .update({
            status: 'dismissed',
            description: updatedDescription,
          })
          .eq('id', smrId);
      }

      // Log audit event
      for (const smrId of smrIds) {
        await supabase.from('audit_logs').insert({
          action_type: 'smr_dismissed',
          entity_type: 'suspicious_activity_report',
          entity_id: smrId,
          description: `SMR dismissed: ${notes}`,
          metadata: {
            dismissed_by: adminCheck.userId,
            reason: notes,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `${smrIds.length} SMR(s) dismissed`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

function exportSMRsAsCSV(records: SMRRecord[]): string {
  if (records.length === 0) return '';

  const headers = [
    'SMR ID',
    'Created Date',
    'Customer Name',
    'Customer Email',
    'Suspicion Category',
    'Transaction Amount',
    'Status',
    'Deadline',
    'Days Remaining',
    'AUSTRAC Reference',
    'Submitted Date',
  ];

  const rows = records.map(record => [
    record.id,
    new Date(record.created_at).toISOString().split('T')[0],
    `"${record.customer_name}"`,
    record.customer_email,
    record.suspicion_category,
    record.transaction_amount ? `$${record.transaction_amount}` : 'N/A',
    record.status,
    record.submission_deadline ? new Date(record.submission_deadline).toISOString().split('T')[0] : 'N/A',
    record.days_remaining !== null ? record.days_remaining.toString() : 'N/A',
    record.austrac_reference || '',
    record.austrac_submitted_at ? new Date(record.austrac_submitted_at).toISOString().split('T')[0] : '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}









