import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@supabase/supabase-js';
import { generateSMR } from '@/lib/compliance/smr-generator';
import { createLogger} from "@/lib/utils/logger";
import { sendEDDInvestigationOpenedEmail, sendEDDInformationRequestEmail, sendEDDCompletionEmail} from "@/lib/email/sendEDDEmails";
import { sendComplianceAlert } from '@/lib/email/sendComplianceAlert';
import { createEDDInvestigation } from '@/lib/compliance/edd-service';


const logger = createLogger('EDD-Investigations');

// Helper to get staff UUID from Clerk ID
async function getStaffId(supabase: any, clerkUserId: string | null): Promise<string | null> {
  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  return staff?.id || null;
}

export async function GET(req: NextRequest) {
  const { authorized, userId, error } = await requireAdmin();
  if (!authorized) return error!;

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

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const transactionId = searchParams.get('transactionId');

  let query = supabase
    .from('edd_investigations')
    .select(`
      *,
      customer:customers!customer_id (
        id,
        first_name,
        last_name,
        email,
        risk_level,
        is_pep,
        verification_status
      ),
      transaction:transactions!transaction_id (
        id,
        amount_aud,
        created_at
      )
    `)
    .order('opened_at', { ascending: false });

  // Apply filters
  if (status && status !== 'all') {
    if (status === 'active') {
      query = query.in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated']);
    } else {
      query = query.eq('status', status);
    }
  }

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (transactionId) {
    query = query.eq('transaction_id', transactionId);
  }

  const { data: investigations, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Transform data for UI
  const investigationsWithCustomer = investigations?.map((inv: any) => ({
    ...inv,
    customer_name: `${inv.customer?.first_name || ''} ${inv.customer?.last_name || ''}`.trim(),
    customer_email: inv.customer?.email,
    customer_risk_level: inv.customer?.risk_level,
    customer_is_pep: inv.customer?.is_pep,
    customer_verification_status: inv.customer?.verification_status,
    transaction_amount_aud: inv.transaction?.amount_aud,
  }));

  return NextResponse.json({ investigations: investigationsWithCustomer });
}

export async function POST(req: NextRequest) {
  const { authorized, userId, error } = await requireAdmin();
  if (!authorized) return error!;

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

  // Convert Clerk ID to Staff UUID
  const staffId = await getStaffId(supabase, userId);
  if (!staffId) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 403 });
  }

  const body = await req.json();
  const { action, investigationId } = body;

  try {
    switch (action) {
      case 'create':
        return await createInvestigation(supabase, body, staffId);

      case 'update_checklist':
        return await updateChecklist(supabase, body, staffId);

      case 'request_information':
        return await requestInformation(supabase, body, staffId);

      case 'escalate':
        return await escalateInvestigation(supabase, body, staffId);

      case 'approve_management':
        return await approveManagement(supabase, body, staffId);

      case 'complete':
        return await completeInvestigation(supabase, body, staffId);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('EDD investigation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Action handlers

// async function createInvestigation(supabase: any, body: any, adminId: any) {
//   const { customer_id, transaction_id, trigger_reason, triggered_by = 'admin' } = body;
//
//   if (!customer_id || !trigger_reason) {
//     return NextResponse.json({ error: 'customer_id and trigger_reason required' }, { status: 400 });
//   }
//
//   // Check for existing open investigation
//   const { data: existing } = await supabase
//     .from('edd_investigations')
//     .select('id, investigation_number')
//     .eq('customer_id', customer_id)
//     .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
//     .single();
//
//   if (existing) {
//     return NextResponse.json({
//       error: 'Customer already has an active investigation',
//       existing_investigation: existing,
//     }, { status: 400 });
//   }
//
//   // Create investigation
//   const { data: investigation, error: createError } = await supabase
//     .from('edd_investigations')
//     .insert({
//       customer_id,
//       transaction_id: transaction_id || null,
//       trigger_reason,
//       triggered_by,
//       triggered_by_admin_id: triggered_by === 'admin' || triggered_by === 'transaction_review' ? adminId : null,
//       assigned_to: adminId,
//       status: 'open',
//     })
//     .select()
//     .single();
//
//   if (createError) {
//     return NextResponse.json({ error: createError.message }, { status: 500 });
//   }
//
//   // Update customer flags
//   await supabase
//     .from('customers')
//     .update({
//       requires_enhanced_dd: true,
//       edd_completed: false,
//       current_investigation_id: investigation.id,
//     })
//     .eq('id', customer_id);
//
//   // Link transaction if provided
//   if (transaction_id) {
//     await supabase
//       .from('transactions')
//       .update({ edd_investigation_id: investigation.id })
//       .eq('id', transaction_id);
//   }
//   const { data: customer } = await supabase
//       .from('customers')
//       .select('email, first_name, last_name')
//       .eq('id', customer_id)
//       .single();
//
//   if (customer?.email) {
//     await sendEDDInvestigationOpenedEmail({
//       customerEmail: customer.email,
//       customerName: `${customer.first_name} ${customer.last_name}`,
//       investigationNumber: investigation.investigation_number,
//     });
//   }
//
//   // Audit log
//   await supabase.from('audit_logs').insert({
//     action_type: 'edd_investigation_created',
//     entity_type: 'edd_investigation',
//     entity_id: investigation.id,
//     description: `EDD investigation created: ${trigger_reason}`,
//     metadata: {
//       investigation_number: investigation.investigation_number,
//       customer_id,
//       transaction_id,
//       triggered_by,
//       admin_id: adminId,
//     },
//   });
//
//   return NextResponse.json({ success: true, investigation });
// }

async function createInvestigation(supabase: any, body: any, adminId: any) {
  const { customer_id, transaction_id, trigger_reason, triggered_by = 'admin' } = body;

  if (!customer_id || !trigger_reason) {
    return NextResponse.json({ error: 'customer_id and trigger_reason required' }, { status: 400 });
  }

  const result = await createEDDInvestigation({
    customerId: customer_id,
    transactionId: transaction_id,
    triggerReason: trigger_reason,
    triggeredBy: triggered_by,
    adminId,
  });

  if (!result.success) {
    return NextResponse.json({
      error: result.error,
    }, { status: 400 });
  }

  return NextResponse.json({ success: true, investigation: result?.investigation });
}

async function updateChecklist(supabase: any, body: any, adminId: any) {
  const { investigationId, section_name, section_data } = body;

  if (!investigationId || !section_name || !section_data) {
    return NextResponse.json(
      { error: 'investigationId, section_name, and section_data required' },
      { status: 400 }
    );
  }

  const validSections = [
    'customer_information_review',
    'employment_verification',
    'source_of_wealth',
    'source_of_funds',
    'transaction_pattern_analysis',
    'additional_information',
  ];

  if (!validSections.includes(section_name)) {
    return NextResponse.json({ error: 'Invalid section name' }, { status: 400 });
  }

  // Get current investigation
  const { data: investigation } = await supabase
    .from('edd_investigations')
    .select(section_name)
    .eq('id', investigationId)
    .single();

  if (!investigation) {
    return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
  }

  // Merge section data with reviewed_by and reviewed_at
  const updatedSection = {
    ...(investigation[section_name] || {}),
    ...section_data,
    reviewed_by: adminId,
    reviewed_at: new Date().toISOString(),
  };

  // Update investigation
  const { error: updateError } = await supabase
    .from('edd_investigations')
    .update({ [section_name]: updatedSection })
    .eq('id', investigationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action_type: 'edd_investigation_updated',
    entity_type: 'edd_investigation',
    entity_id: investigationId,
    description: `Investigation checklist updated: ${section_name}`,
    metadata: {
      section_name,
      completed: section_data.completed,
      admin_id: adminId,
    },
  });

  return NextResponse.json({ success: true });
}

async function requestInformation(supabase: any, body: any, adminId: any) {
  const { investigationId, items, deadline } = body;

  if (!investigationId || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'investigationId and items array required' }, { status: 400 });
  }

  // Get current investigation
  const { data: investigation } = await supabase
    .from('edd_investigations')
    .select('information_requests, customer_id')
    .eq('id', investigationId)
    .single();

  if (!investigation) {
    return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
  }

  // Create new information request
  const newRequest = {
    id: crypto.randomUUID(),
    requested_at: new Date().toISOString(),
    requested_by: adminId,
    items,
    deadline: deadline || null,
    status: 'pending',
    received_at: null,
    response_notes: null,
  };

  const updatedRequests = [...(investigation.information_requests || []), newRequest];

  // Update investigation
  const { error: updateError } = await supabase
    .from('edd_investigations')
    .update({
      information_requests: updatedRequests,
      status: 'awaiting_customer_info',
    })
    .eq('id', investigationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: investigationWithCustomer } = await supabase
      .from('edd_investigations')
      .select(`
      investigation_number,
      customer:customers!customer_id (
        email,
        first_name,
        last_name
      )
    `)
      .eq('id', investigationId)
      .single();

  if (investigationWithCustomer?.customer?.email) {
    await sendEDDInformationRequestEmail({
      customerEmail: investigationWithCustomer.customer.email,
      customerName: `${investigationWithCustomer.customer.first_name} ${investigationWithCustomer.customer.last_name}`,
      investigationNumber: investigationWithCustomer.investigation_number,
      requestedItems: items,
      deadline,
    });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action_type: 'edd_information_requested',
    entity_type: 'edd_investigation',
    entity_id: investigationId,
    description: `Information requested from customer: ${items.join(', ')}`,
    metadata: {
      items,
      deadline,
      admin_id: adminId,
    },
  });


  return NextResponse.json({ success: true, request: newRequest });
}

async function escalateInvestigation(supabase: any, body: any, adminId: any) {
  const { investigationId, reason, escalated_to } = body;

  if (!investigationId || !reason) {
    return NextResponse.json({ error: 'investigationId and reason required' }, { status: 400 });
  }

  // Get current investigation
  const { data: investigation } = await supabase
    .from('edd_investigations')
    .select(`
      escalations,
      investigation_number,
      customer:customers!customer_id (
        first_name,
        last_name
      )
    `)
    .eq('id', investigationId)
    .single();

  if (!investigation) {
    return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
  }

  // Create escalation record
  const newEscalation = {
    id: crypto.randomUUID(),
    escalated_at: new Date().toISOString(),
    escalated_by: adminId,
    escalated_to: escalated_to || 'management',
    reason,
    resolved: false,
    resolved_at: null,
    resolution_notes: null,
  };

  const updatedEscalations = [...(investigation.escalations || []), newEscalation];

  // Update investigation
  const { error: updateError } = await supabase
    .from('edd_investigations')
    .update({
      escalations: updatedEscalations,
      status: 'escalated',
    })
    .eq('id', investigationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action_type: 'edd_investigation_escalated',
    entity_type: 'edd_investigation',
    entity_id: investigationId,
    description: `Investigation escalated: ${reason}`,
    metadata: {
      reason,
      escalated_to,
      admin_id: adminId,
    },
  });

  // Send escalation notification to management
  const customerName = investigation.customer
    ? `${investigation.customer.first_name} ${investigation.customer.last_name}`
    : 'Unknown';

  await sendComplianceAlert({
    type: 'edd_escalation',
    severity: 'high',
    title: 'EDD Investigation Escalated to Management',
    description: `Investigation ${investigation.investigation_number} for ${customerName} has been escalated. Reason: ${reason}`,
    metadata: {
      investigation_id: investigationId,
      investigation_number: investigation.investigation_number,
      customer_name: customerName,
      escalated_to: escalated_to || 'management',
      reason,
    },
    actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/edd-investigations`,
  });

  return NextResponse.json({ success: true, escalation: newEscalation });
}

async function approveManagement(supabase: any, body: any, managementId: any) {
  const { investigationId } = body;

  if (!investigationId) {
    return NextResponse.json({ error: 'investigationId required' }, { status: 400 });
  }

  // Get investigation
  const { data: investigation } = await supabase
    .from('edd_investigations')
    .select('compliance_recommendation')
    .eq('id', investigationId)
    .single();

  if (!investigation) {
    return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
  }

  // Verify this investigation requires management approval
  const highRiskDecisions = ['reject_relationship', 'escalate_to_smr'];
  if (!investigation.compliance_recommendation || !highRiskDecisions.includes(investigation.compliance_recommendation)) {
    return NextResponse.json({
      error: 'Management approval only required for reject_relationship or escalate_to_smr decisions',
    }, { status: 400 });
  }

  // Grant approval
  const { error: updateError } = await supabase
    .from('edd_investigations')
    .update({
      approved_by_management: true,
      management_approver_id: managementId,
      management_approved_at: new Date().toISOString(),
    })
    .eq('id', investigationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action_type: 'edd_management_approved',
    entity_type: 'edd_investigation',
    entity_id: investigationId,
    description: 'Management approval granted for investigation',
    metadata: {
      management_id: managementId,
      decision: investigation.compliance_recommendation,
    },
  });

  return NextResponse.json({ success: true });
}

async function completeInvestigation(supabase: any, body: any, adminId: any) {
  const {
    investigationId,
    investigation_findings,
    risk_assessment_summary,
    compliance_recommendation,
  } = body;

  if (!investigationId || !investigation_findings || !risk_assessment_summary || !compliance_recommendation) {
    return NextResponse.json({
      error: 'investigationId, investigation_findings, risk_assessment_summary, and compliance_recommendation required',
    }, { status: 400 });
  }

  // Get investigation
  const { data: investigation } = await supabase
    .from('edd_investigations')
    .select('*, customer:customers!customer_id(id)')
    .eq('id', investigationId)
    .single();

  if (!investigation) {
    return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
  }

  // Check management approval for high-risk decisions
  const highRiskDecisions = ['reject_relationship', 'escalate_to_smr'];
  if (highRiskDecisions.includes(compliance_recommendation) && !investigation.approved_by_management) {
    return NextResponse.json({
      error: 'Management approval required for this decision. Please request management approval first.',
    }, { status: 403 });
  }

  // Map compliance recommendation to monitoring level
  const monitoringLevelMap: Record<string, string> = {
    approve_relationship: 'standard',
    ongoing_monitoring: 'ongoing_review',
    enhanced_monitoring: 'enhanced',
    reject_relationship: 'blocked',
    escalate_to_smr: 'blocked',
  };

  const newMonitoringLevel = monitoringLevelMap[compliance_recommendation];

  // Map compliance recommendation to investigation status
  const statusMap: Record<string, string> = {
    approve_relationship: 'completed_approved',
    ongoing_monitoring: 'completed_ongoing_monitoring',
    enhanced_monitoring: 'completed_ongoing_monitoring',
    reject_relationship: 'completed_rejected',
    escalate_to_smr: 'completed_rejected',
  };

  const newStatus = statusMap[compliance_recommendation] || 'completed_approved';

  // Update investigation
  const { error: investigationError } = await supabase
    .from('edd_investigations')
    .update({
      investigation_findings,
      risk_assessment_summary,
      compliance_recommendation,
      status: newStatus,
      reviewed_by: adminId,
      completed_at: new Date().toISOString(),
    })
    .eq('id', investigationId);

  if (investigationError) {
    return NextResponse.json({ error: investigationError.message }, { status: 500 });
  }

  // Update customer
  await supabase
    .from('customers')
    .update({
      edd_completed: true,
      requires_enhanced_dd: false,
      monitoring_level: newMonitoringLevel,
      current_investigation_id: null,
      last_investigation_completed_at: new Date().toISOString(),
    })
    .eq('id', investigation.customer_id);

  // If escalate_to_smr, generate SMR
  if (compliance_recommendation === 'escalate_to_smr') {
    // Get transaction amount if linked
    let transactionAmount = 0;
    if (investigation.transaction_id) {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('amount_aud')
        .eq('id', investigation.transaction_id)
        .single();
      transactionAmount = transaction?.amount_aud || 0;
    }

    const { data: smr } = await generateSMR({
      customerId: investigation.customer_id,
      suspicionType: 'enhanced_dd_escalation',
      indicators: [
        investigation_findings,
        risk_assessment_summary,
      ],
      narrative: `EDD Investigation ${investigation.investigation_number} escalated to SMR. ${investigation_findings}`,
      transactionAmount,
    });

    // Link SMR to investigation
    if (smr) {
      await supabase
        .from('suspicious_activity_reports')
        .update({ edd_investigation_id: investigationId })
        .eq('id', smr.id);
    }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action_type: 'edd_investigation_completed',
    entity_type: 'edd_investigation',
    entity_id: investigationId,
    description: `Investigation completed with decision: ${compliance_recommendation}`,
    metadata: {
      decision: compliance_recommendation,
      monitoring_level: newMonitoringLevel,
      admin_id: adminId,
    },
  });

  // Send completion email to customer
  const { data: customer } = await supabase
    .from('customers')
    .select('email, first_name, last_name')
    .eq('id', investigation.customer_id)
    .single();

  if (customer?.email) {
    // Map compliance recommendation to email decision type
    const decisionMap: Record<string, 'approved' | 'ongoing_monitoring' | 'enhanced_monitoring' | 'blocked'> = {
      approve_relationship: 'approved',
      ongoing_monitoring: 'ongoing_monitoring',
      enhanced_monitoring: 'enhanced_monitoring',
      reject_relationship: 'blocked',
      escalate_to_smr: 'blocked',
    };

    await sendEDDCompletionEmail({
      customerEmail: customer.email,
      customerName: `${customer.first_name} ${customer.last_name}`,
      investigationNumber: investigation.investigation_number,
      decision: decisionMap[compliance_recommendation],
    });
  }

  return NextResponse.json({
    success: true,
    monitoring_level: newMonitoringLevel,
    smr_created: compliance_recommendation === 'escalate_to_smr',
  });
}
