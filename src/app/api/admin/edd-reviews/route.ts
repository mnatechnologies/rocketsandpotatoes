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

async function handleEDDRejection(customerId: string, eddId: string, notes: string, isManagement: boolean) {
  try {
    logger.log(`Handling EDD rejection for customer ${customerId}, EDD ${eddId}`);

    // 1. Update customer monitoring level to blocked
    const { error: customerUpdateError } = await supabase
      .from('customers')
      .update({
        monitoring_level: 'blocked',
        blocked_reason: 'EDD rejection',
        blocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (customerUpdateError) {
      logger.error('Error updating customer monitoring level:', customerUpdateError);
      throw customerUpdateError;
    }

    // 2. Close any active EDD investigation
    const { data: activeInvestigation } = await supabase
      .from('edd_investigations')
      .select('id, investigation_number')
      .eq('customer_id', customerId)
      .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
      .single();

    if (activeInvestigation) {
      const { error: investigationUpdateError } = await supabase
        .from('edd_investigations')
        .update({
          status: 'completed_rejected',
          compliance_recommendation: 'reject_relationship',
          investigation_findings: `EDD rejected by ${isManagement ? 'management' : 'admin'}: ${notes}`,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeInvestigation.id);

      if (investigationUpdateError) {
        logger.error('Error updating investigation:', investigationUpdateError);
        throw investigationUpdateError;
      }

      logger.log(`Closed investigation ${activeInvestigation.investigation_number} as rejected`);
    }

    // 3. Send compliance alert
    await sendComplianceAlert({
      type: 'edd_rejection',
      severity: 'high',
      title: 'EDD Submission Rejected - Customer Blocked',
      description: `EDD submission rejected${isManagement ? ' by management' : ''}. Customer account has been blocked.`,
      metadata: {
        customer_id: customerId,
        edd_id: eddId,
        rejection_notes: notes,
        investigation_id: activeInvestigation?.id
      },
      actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/customers/${customerId}`,
    });

    // 4. Log additional audit events
    await supabase.from('audit_logs').insert([
      {
        action_type: 'customer_blocked_edd_rejection',
        entity_type: 'customer',
        entity_id: customerId,
        description: `Customer blocked due to EDD rejection: ${notes}`,
        metadata: { edd_id: eddId, blocked_reason: 'EDD rejection' },
        created_at: new Date().toISOString(),
      },
      ...(activeInvestigation ? [{
        action_type: 'edd_investigation_completed_rejected',
        entity_type: 'edd_investigation',
        entity_id: activeInvestigation.id,
        description: `EDD investigation closed as rejected: ${notes}`,
        metadata: { customer_id: customerId, edd_id: eddId },
        created_at: new Date().toISOString(),
      }] : [])
    ]);

    logger.log(`EDD rejection handled successfully for customer ${customerId}`);

  } catch (error) {
    logger.error('Error handling EDD rejection:', error);
    throw error;
  }
}

async function handleEDDApproval(customerId: string, eddId: string, isManagement: boolean) {
  try {
    logger.log(`Handling EDD approval for customer ${customerId}, EDD ${eddId}`);

    // 1. Update customer monitoring level to enhanced (approved but still monitored)
    const { error: customerUpdateError } = await supabase
      .from('customers')
      .update({
        monitoring_level: 'enhanced', // Keep enhanced monitoring for approved EDD customers
        edd_completed: true,
        edd_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (customerUpdateError) {
      logger.error('Error updating customer monitoring level:', customerUpdateError);
      throw customerUpdateError;
    }

    // 2. Close any active EDD investigation
    const { data: activeInvestigation } = await supabase
      .from('edd_investigations')
      .select('id, investigation_number')
      .eq('customer_id', customerId)
      .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
      .single();

    if (activeInvestigation) {
      const { error: investigationUpdateError } = await supabase
        .from('edd_investigations')
        .update({
          status: 'completed_approved',
          compliance_recommendation: 'ongoing_monitoring',
          investigation_findings: `EDD approved by ${isManagement ? 'management' : 'admin'}`,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeInvestigation.id);

      if (investigationUpdateError) {
        logger.error('Error updating investigation:', investigationUpdateError);
        throw investigationUpdateError;
      }

      logger.log(`Closed investigation ${activeInvestigation.investigation_number} as approved`);
    }

    // 3. Send compliance alert
    await sendComplianceAlert({
      type: 'edd_approval',
      severity: 'medium',
      title: 'EDD Submission Approved',
      description: `EDD submission approved${isManagement ? ' by management' : ''}. Customer monitoring level set to enhanced.`,
      metadata: {
        customer_id: customerId,
        edd_id: eddId,
        investigation_id: activeInvestigation?.id
      },
      actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/customers/${customerId}`,
    });

    // 4. Log additional audit events
    await supabase.from('audit_logs').insert([
      {
        action_type: 'customer_monitoring_enhanced_edd_approval',
        entity_type: 'customer',
        entity_id: customerId,
        description: 'Customer monitoring level set to enhanced after EDD approval',
        metadata: { edd_id: eddId, monitoring_level: 'enhanced' },
        created_at: new Date().toISOString(),
      },
      ...(activeInvestigation ? [{
        action_type: 'edd_investigation_completed_approved',
        entity_type: 'edd_investigation',
        entity_id: activeInvestigation.id,
        description: 'EDD investigation closed as approved',
        metadata: { customer_id: customerId, edd_id: eddId },
        created_at: new Date().toISOString(),
      }] : [])
    ]);

    logger.log(`EDD approval handled successfully for customer ${customerId}`);

  } catch (error) {
    logger.error('Error handling EDD approval:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireManagement();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { eddId, action, notes } = await req.json();
    logger.log(eddId)

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

        // Handle approval consequences
        await handleEDDApproval(eddRecord.customer_id, eddId, false);
        break;
      case 'reject':
        newStatus = 'rejected';
        auditAction = 'edd_rejected';
        auditDescription = `EDD submission rejected: ${notes}`;

        // Handle rejection consequences
        await handleEDDRejection(eddRecord.customer_id, eddId, notes, false);
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

        // Handle approval consequences
        await handleEDDApproval(eddRecord.customer_id, eddId, true);
        break;

      case 'management_reject':

        const rejectMgmtCheck = await requireManagement();
        if (!rejectMgmtCheck.authorized) return rejectMgmtCheck.error;

        newStatus = 'rejected';
        auditAction = 'edd_management_rejected';
        auditDescription = `EDD submission rejected by management: ${notes}`;

        // Handle rejection consequences
        await handleEDDRejection(eddRecord.customer_id, eddId, notes, true);
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









