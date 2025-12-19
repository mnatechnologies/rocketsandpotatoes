import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';

const logger = createLogger('DOCUMENT_VERIFICATION_API');

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

// GET - Fetch documents for review
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    let query = supabase
      .from('customer_documents')
      .select(`
        *,
        customer:customers (
          first_name,
          last_name,
          email,
          verification_status
        )
      `)
      .order('uploaded_at', { ascending: false });

    if (status === 'pending') {
      query = query.eq('review_status', 'pending');
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching documents:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data });
  } catch (error: any) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update document review status
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { documentId, decision, notes, rejectionReason, certificationValidated } = await req.json();

    if (!documentId || !decision || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get admin user ID from auth
    const adminUserId = adminCheck.userId;

    // Build update data
    const updateData: any = {
      review_status: decision,
      review_notes: notes,
      rejection_reason: rejectionReason || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
    };

    // If certification was validated by admin, record it
    if (certificationValidated === true) {
      updateData.certification_validated = true;
      updateData.certification_validated_by = adminUserId;
      updateData.certification_validated_at = new Date().toISOString();
    }

    // Update document status
    const { data: docData, error: docError } = await supabase
      .from('customer_documents')
      .update(updateData)
      .eq('id', documentId)
      .select('*, customer:customers(id, verification_status)')
      .single();

    if (docError) {
      logger.error('Error updating document:', docError);
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }

    // If approved, check if customer has all required docs approved
    if (decision === 'approved') {
      const customerId = docData.customer_id;

      // Get all documents for this customer
      const { data: allDocs, error: docsError } = await supabase
        .from('customer_documents')
        .select('review_status')
        .eq('customer_id', customerId);

      if (!docsError && allDocs) {
        const hasRejected = allDocs.some(d => d.review_status === 'rejected');
        const hasPending = allDocs.some(d => d.review_status === 'pending');
        const allApproved = allDocs.every(d => d.review_status === 'approved');

        // Update customer verification status
        let newStatus = 'pending';
        if (allApproved && allDocs.length > 0) {
          newStatus = 'verified';
        } else if (hasRejected) {
          newStatus = 'rejected';
        }

        await supabase
          .from('customers')
          .update({ verification_status: newStatus })
          .eq('id', customerId);
      }
    }

    // If rejected, update customer status
    if (decision === 'rejected') {
      await supabase
        .from('customers')
        .update({ verification_status: 'rejected' })
        .eq('id', docData.customer_id);
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action_type: `document_${decision}`,
      entity_type: 'customer_document',
      entity_id: documentId,
      description: `Document ${decision} by admin: ${notes}`,
      metadata: {
        document_id: documentId,
        decision,
        rejection_reason: rejectionReason,
        certification_validated: certificationValidated || false,
        admin_user_id: adminUserId
      },
    });

    return NextResponse.json({
      success: true,
      message: `Document ${decision} successfully`
    });
  } catch (error: any) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}