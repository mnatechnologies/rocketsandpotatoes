import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to calculate training status
function calculateTrainingStatus(staff: any, trainingRecords: any[]): {
  status: 'compliant' | 'overdue' | 'no_training' | 'not_applicable';
  label: string;
  color: string;
} {
  // If staff doesn't require AML training
  if (!staff.requires_aml_training) {
    return { status: 'not_applicable', label: 'Not Applicable', color: 'gray' };
  }

  // Filter to completed training records
  const completedTraining = trainingRecords.filter(
    t => t.completion_status === 'completed'
  );

  // No completed training
  if (completedTraining.length === 0) {
    return { status: 'no_training', label: 'No Training', color: 'red' };
  }

  // Find most recent training with a due date
  const trainingsWithDueDate = completedTraining.filter(t => t.next_training_due);

  if (trainingsWithDueDate.length === 0) {
    // Has training but no due date set
    return { status: 'compliant', label: 'Compliant', color: 'green' };
  }

  // Sort by next_training_due to get the earliest due date
  trainingsWithDueDate.sort((a, b) =>
    new Date(a.next_training_due).getTime() - new Date(b.next_training_due).getTime()
  );

  const nextDueDate = new Date(trainingsWithDueDate[0].next_training_due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if overdue
  if (nextDueDate < today) {
    return { status: 'overdue', label: 'Overdue', color: 'red' };
  }

  // Compliant
  return { status: 'compliant', label: 'Compliant', color: 'green' };
}

// GET /api/admin/staff - List all staff
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('staff')
      .select('*')
      .order('full_name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: staff, error } = await query;

    if (error) throw error;

    // Fetch training records for all staff
    const { data: allTraining } = await supabase
      .from('staff_training')
      .select('*')
      .order('training_date', { ascending: false });

    // Calculate training status for each staff member
    const staffWithStatus = staff?.map(member => {
      const memberTraining = allTraining?.filter(t => t.staff_id === member.id) || [];
      const trainingStatus = calculateTrainingStatus(member, memberTraining);

      return {
        ...member,
        training_status: trainingStatus,
      };
    }) || [];

    return NextResponse.json({ success: true, staff: staffWithStatus });
  } catch (error) {
    console.error('[ADMIN_STAFF_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST /api/admin/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clerk_user_id,
      full_name,
      email,
      position,
      department,
      employment_start_date,
      requires_aml_training = true,
    } = body;

    // Validation
    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('staff')
      .select('id')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Staff member with this email already exists' },
        { status: 409 }
      );
    }

    const { data: newStaff, error } = await supabase
      .from('staff')
      .insert({
        clerk_user_id,
        full_name,
        email,
        position,
        department,
        employment_start_date: employment_start_date || new Date().toISOString().split('T')[0],
        requires_aml_training,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, staff: newStaff }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_STAFF_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
