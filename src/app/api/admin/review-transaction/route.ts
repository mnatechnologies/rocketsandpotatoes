import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { transactionId, decision, notes } = await req.json();

  if (!notes || notes.trim().length === 0) {
    return NextResponse.json({ error: 'Review notes are required' }, { status: 400 });
  }

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

  // Update transaction
  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      review_status: decision === 'approve' ? 'approved' : 'rejected',
      review_notes: notes,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  if (updateError) {
    console.error('Error updating transaction:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log audit event
  await supabase.from('audit_logs').insert({
    action_type: 'transaction_reviewed',
    entity_type: 'transaction',
    entity_id: transactionId,
    description: `Transaction ${decision}ed by admin: ${notes}`,
    metadata: {
      decision,
      notes,
      reviewed_by: userId,
    },
  });

  return NextResponse.json({ success: true });
}