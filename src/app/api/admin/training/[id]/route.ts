import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/admin/training/[id] - Update training record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      training_type,
      training_date,
      training_provider,
      topics_covered,
      duration_hours,
      completion_status,
      pass_score,
      certificate_url,
      conducted_by,
      next_training_due,
      notes,
    } = body;

    const updateData: any = {};
    if (training_type !== undefined) updateData.training_type = training_type;
    if (training_date !== undefined) updateData.training_date = training_date;
    if (training_provider !== undefined) updateData.training_provider = training_provider;
    if (topics_covered !== undefined) updateData.topics_covered = topics_covered;
    if (duration_hours !== undefined) updateData.duration_hours = duration_hours;
    if (completion_status !== undefined) updateData.completion_status = completion_status;
    if (pass_score !== undefined) updateData.pass_score = pass_score;
    if (certificate_url !== undefined) updateData.certificate_url = certificate_url;
    if (conducted_by !== undefined) updateData.conducted_by = conducted_by;
    if (next_training_due !== undefined) updateData.next_training_due = next_training_due;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updatedTraining, error } = await supabase
      .from('staff_training')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, training: updatedTraining });
  } catch (error) {
    console.error('[ADMIN_TRAINING_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update training record' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/training/[id] - Delete training record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('staff_training')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Training record deleted' });
  } catch (error) {
    console.error('[ADMIN_TRAINING_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete training record' },
      { status: 500 }
    );
  }
}
