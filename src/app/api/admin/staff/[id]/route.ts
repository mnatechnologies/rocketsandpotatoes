import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/staff/[id] - Get single staff member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id }  = await params

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Get training records for this staff member
    const { data: training } = await supabase
      .from('staff_training')
      .select('*')
      .eq('staff_id', id)
      .order('training_date', { ascending: false });

    return NextResponse.json({ success: true, staff: { ...staff, training_records: training || [] } });
  } catch (error) {
    console.error('[ADMIN_STAFF_GET_ID]', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/staff/[id] - Update staff member
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
      full_name,
      email,
      position,
      department,
      employment_start_date,
      employment_end_date,
      is_active,
      requires_aml_training,
      clerk_user_id,
    } = body;

    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department;
    if (employment_start_date !== undefined) updateData.employment_start_date = employment_start_date;
    if (employment_end_date !== undefined) updateData.employment_end_date = employment_end_date;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (requires_aml_training !== undefined) updateData.requires_aml_training = requires_aml_training;
    if (clerk_user_id !== undefined) updateData.clerk_user_id = clerk_user_id;

    const { data: updatedStaff, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, staff: updatedStaff });
  } catch (error) {
    console.error('[ADMIN_STAFF_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/staff/[id] - Soft delete (mark as inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete - mark as inactive and set end date
    const { data, error } = await supabase
      .from('staff')
      .update({
        is_active: false,
        employment_end_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Staff member deactivated' });
  } catch (error) {
    console.error('[ADMIN_STAFF_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to deactivate staff member' },
      { status: 500 }
    );
  }
}
