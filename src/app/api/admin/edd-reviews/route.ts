import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireManagement } from '@/lib/auth/admin';
import {sendComplianceAlert} from "@/lib/email/sendComplianceAlert";

const logger = createLogger('ADMIN_EDD_REVIEWS');

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
  const adminCheck = await requireManagement();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'pending';

    let query = supabase
      .from('customer_edd')
      .select(`
        id,
        customer_id,
        source_of_wealth,
        source_of_wealth_details,
        transaction_purpose,
        transaction_purpose_details,
        expected_frequency,
        expected_annual_volume,
        status,
        reviewed_by,
        reviewed_at,
        review_notes,
        submitted_at,
        customer:customers (
          first_name,
          last_name,
          email,
          is_pep,
          pep_relationship
        )
      `)
      .order('submitted_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: eddRecords, error } = await query;

    if (error) {
      logger.error('Error fetching EDD records:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedRecords = eddRecords?.map(record => {
      const customer = record.customer as { first_name?: string; last_name?: string; email?: string; is_pep?: boolean; pep_relationship?: string } | null;
      return {
        ...record,
        customer_name: customer
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : 'Unknown',
        customer_email: customer?.email || 'N/A',
        is_pep: customer?.is_pep || false,
        pep_relationship: customer?.pep_relationship || null,
      };
    }) || [];

    return NextResponse.json({ records: formattedRecords });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireManagement();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { eddId, action, notes } = await req.json();

    if (!eddId || !action) {
      return NextResponse.json(
        { error: 'EDD ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'request_info', 'escalated', 'management_approve', 'management_reject'].includes(action)) {
      return NextResponse.json(
          { error: 'Invalid action. Must be: approve, reject, request_info, escalated, management_approve, management_reject' },
          { status: 400 }
      );
    }

    if ((action === 'reject' || action === 'management_reject') && !notes) {
      return NextResponse.json(
          { error: 'Notes are required when rejecting an EDD submission' },
          { status: 400 }
      );
    }

    // Get the EDD record to find customer_id
    const { data: eddRecord, error: fetchError } = await supabase
      .from('customer_edd')
      .select('customer_id')
      .eq('id', eddId)
      .single();

    if (fetchError || !eddRecord) {
      return NextResponse.json({ error: 'EDD record not found' }, { status: 404 });
    }

    let newStatus: string;
    let auditAction: string;
    let auditDescription: string;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        auditAction = 'edd_approved';
        auditDescription = 'EDD submission approved by admin';
        break;
      case 'reject':
        newStatus = 'rejected';
        auditAction = 'edd_rejected';
        auditDescription = `EDD submission rejected: ${notes}`;
        break;
      case 'request_info':
        newStatus = 'under_review';
        auditAction = 'edd_info_requested';
        auditDescription = `Additional information requested: ${notes}`;
        break;
      case 'escalated':

        newStatus = 'escalated';
        auditAction = 'edd_escalated';
        auditDescription = 'EDD submission escalated to management';

        // Update database with escalation timestamp
        const { error: escalateError } = await supabase
            .from('customer_edd')
            .update({
              status: 'escalated',
              escalated_to_management_at: new Date().toISOString()
            })
            .eq('id', eddId);

        if (escalateError) return NextResponse.json({ error: escalateError.message }, { status: 500 });

        await sendComplianceAlert({
          type: 'edd_escalation',
          severity: 'medium',
          title: 'EDD Review Escalated to Management',
          description: `EDD submission requires management approval.`,
          metadata: { edd_id: eddId },
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/edd-reviews`,
        });
        break;

      case 'management_approve':

        const mgmtCheck = await requireManagement();
        if (!mgmtCheck.authorized) return mgmtCheck.error;

        newStatus = 'approved';
        auditAction = 'edd_management_approved';
        auditDescription = 'EDD submission approved by management';
        break;

      case 'management_reject':

        const rejectMgmtCheck = await requireManagement();
        if (!rejectMgmtCheck.authorized) return rejectMgmtCheck.error;

        newStatus = 'rejected';
        auditAction = 'edd_management_rejected';
        auditDescription = `EDD submission rejected by management: ${notes}`;
        break;


      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update EDD record
    const { error: updateError } = await supabase
      .from('customer_edd')
      .update({
        status: newStatus,
        reviewed_by: action.startsWith('management_') ? (await requireManagement()).userId : adminCheck.userId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eddId);

    if (updateError) {
      logger.error('Error updating EDD record:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action_type: auditAction,
      entity_type: 'customer_edd',
      entity_id: eddId,
      description: auditDescription,
      metadata: {
        customer_id: eddRecord.customer_id,
        reviewed_by: adminCheck.userId,
        notes,
      },
    });

    logger.log(`EDD ${eddId} ${action}ed by admin ${adminCheck.userId}`);

    return NextResponse.json({
      success: true,
      message: `EDD submission ${action}ed successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}









