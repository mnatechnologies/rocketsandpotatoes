import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    // Get document metadata
    const { data: doc, error: docError } = await supabase
      .from('customer_documents')
      .select('storage_path')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Generate signed URL for the document
    const { data: urlData, error: urlError } = await supabase.storage
      .from('customer-documents')
      .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry

    if (urlError) {
      return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }

    return NextResponse.json({ url: urlData.signedUrl });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}