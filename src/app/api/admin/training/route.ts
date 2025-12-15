import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/training - List training records
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');
    const dueSoon = searchParams.get('due_soon') === 'true'; // Training due in next 30 days

    let query = supabase
      .from('staff_training')
      .select(`
        *,
        staff:staff_id (
          id,
          full_name,
          email,
          position,
          is_active
        )
      `)
      .order('training_date', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    if (dueSoon) {
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);

      query = query
        .gte('next_training_due', today.toISOString().split('T')[0])
        .lte('next_training_due', in30Days.toISOString().split('T')[0]);
    }

    const { data: training, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, training });
  } catch (error) {
    console.error('[ADMIN_TRAINING_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch training records' },
      { status: 500 }
    );
  }
}

// POST /api/admin/training - Create training record
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      staff_id,
      training_type,
      training_date,
      training_provider,
      topics_covered,
      duration_hours,
      completion_status = 'completed',
      pass_score,
      certificate_url,
      conducted_by,
      notes,
    } = body;

    // Validation
    if (!staff_id || !training_type || !training_date) {
      return NextResponse.json(
        { error: 'Staff ID, training type, and date are required' },
        { status: 400 }
      );
    }

    // Auto-calculate next training due date (1 year for annual refreshers)
    let next_training_due = null;
    if (training_type === 'initial_aml' || training_type === 'annual_refresher') {
      const trainingDate = new Date(training_date);
      const nextDue = new Date(trainingDate);
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      next_training_due = nextDue.toISOString().split('T')[0];
    }

    const { data: newTraining, error } = await supabase
      .from('staff_training')
      .insert({
        staff_id,
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
      })
      .select(`
        *,
        staff:staff_id (
          id,
          full_name,
          email,
          position
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, training: newTraining }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_TRAINING_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create training record' },
      { status: 500 }
    );
  }
}
