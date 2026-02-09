import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createLogger}  from "@/lib/utils/logger";
import { auth } from '@clerk/nextjs/server';

const logger = createLogger('DOCUMENT_UPLOAD_API')

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await (req as any).formData();

  const supabase = await createServerSupabase();

  const file = formData.get('file') as File;
  const customerId = formData.get('customerId') as string;
  const documentType = formData.get('documentType') as string;
  const documentCategory = formData.get('documentCategory') as string;

  // Certification data
  const isCertified = formData.get('isCertified') === 'true';
  const certifierName = formData.get('certifierName') as string;
  const certifierType = formData.get('certifierType') as string;
  const certifierRegistration = formData.get('certifierRegistration') as string;
  const certificationDate = formData.get('certificationDate') as string;

  if (!file || !customerId || !documentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify customer belongs to authenticated user
  const { data: customerOwner } = await supabase
    .from('customers')
    .select('clerk_user_id')
    .eq('id', customerId)
    .single();

  if (!customerOwner || customerOwner.clerk_user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Validate certification if claimed
  if (isCertified) {
    if (!certifierName || !certifierType || !certificationDate) {
      return NextResponse.json({
        error: 'Certification details incomplete. Please provide certifier name, type, and date.'
      }, { status: 400 });
    }
  }

  try {
    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${customerId}/manual/${documentType}_${timestamp}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('customer-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      logger.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    logger.log('✅ File uploaded to storage:', fileName);

    const { data: docData, error: docError } = await supabase
      .from('customer_documents')
      .insert({
        customer_id: customerId,
        document_category: documentCategory,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: fileName,
        uploaded_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        // Certification fields
        is_certified: isCertified,
        certifier_name: isCertified ? certifierName : null,
        certifier_type: isCertified ? certifierType : null,
        certifier_registration_number: isCertified ? certifierRegistration : null,
        certification_date: isCertified && certificationDate ? certificationDate : null,
        review_status: 'pending',
      })
      .select()
      .single();

    if (docError || !docData) {
      logger.error('Database insert error:', docError);
      return NextResponse.json({
        error: `Database error: ${docError?.message || 'Failed to store document metadata'}`,
        }, { status: 500 });
    }

    logger.log('✅ Document metadata saved:', docData.id);

    // Update customer status to pending manual review
    const { error: customerUpdateError } = await supabase
      .from('customers')
      .update({ verification_status: 'pending' })
      .eq('id', customerId);

    if (customerUpdateError) {
      logger.error('Customer update error:', customerUpdateError);
      // Don't fail the request, but log it
    }

    // Log audit event
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        action_type: 'document_uploaded',
        entity_type: 'customer_document',
        entity_id: docData.id,
        description: `Customer uploaded ${documentType} for manual verification`,
        metadata: { customer_id: customerId, document_type: documentType },
      });

    if (auditError) {
      logger.error('Audit log error:', auditError);
    }

    logger.log('✅ Upload complete');

    return NextResponse.json({
      success: true,
      documentId: docData.id,
      message: 'Document uploaded successfully. Manual review typically takes 1-2 business days.'
    });

  } catch (error: any) {
    logger.error('Unexpected error during upload:', error);
    return NextResponse.json({
      error: 'Internal server error during document upload'
    }, { status: 500 });
  }
}