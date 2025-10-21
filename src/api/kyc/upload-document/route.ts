import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const formData = await (req as any).formData();
  const supabase = createServerSupabase();
  const file = formData.get('file') as File;
  const customerId = formData.get(')customerId') as string;
  const documentType = formData.get('documentType') as string;
  const documentCategory = formData.get('documentCategory') as string;

  if (!file || !customerId || !documentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }


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
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Store metadata
  const { data: docData, error: docError } = await supabase
    .from('customer_documents')
    .insert({
      customer_id: customerId,
      document_category: documentCategory,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (docError || !docData) {
    return NextResponse.json({ error: docError?.message }, { status: 500 });
  }

  const documentId = docData!.id;

  // Update customer status to pending manual review
  await supabase
    .from('customers')
    .update({ verification_status: 'pending' })
    .eq('id', customerId);

  // Log audit event
  await supabase.from('audit_logs').insert({
    action_type: 'document_uploaded',
    entity_type: 'customer_document',
    entity_id: docData.id,
    description: `Customer uploaded ${documentType} for manual verification`,
    metadata: { customer_id: customerId, document_type: documentType },
  });

  return NextResponse.json({
    success: true,
    documentId: docData.id,
    message: 'Document uploaded successfully. Manual review typically takes 1-2 business days.'
  });
}