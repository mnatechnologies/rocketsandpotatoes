import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger("TRAINING_COMPLIANCE_API");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/reports/training-compliance - Generate training compliance report
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Get all staff
    const { data: allStaff } = await supabase
      .from('staff')
      .select('*')
      .order('full_name');

    // Get training records for the year
    const { data: trainingRecords } = await supabase
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
      .gte('training_date', startDate)
      .lte('training_date', endDate)
      .order('training_date', { ascending: false });

    // Calculate statistics
    const activeStaff = allStaff?.filter(s => s.is_active) || [];
    const requireTraining = activeStaff.filter(s => s.requires_aml_training);

    const trainedStaff = new Set(
      trainingRecords
        ?.filter(t => t.completion_status === 'completed')
        .map(t => t.staff_id) || []
    );

    const complianceRate = requireTraining.length > 0
      ? (trainedStaff.size / requireTraining.length) * 100
      : 0;

    // Staff needing training
    const staffNeedingTraining = requireTraining.filter(s => !trainedStaff.has(s.id));

    // Overdue training
    const today = new Date().toISOString().split('T')[0];
    const { data: overdueRecords } = await supabase
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
      .lt('next_training_due', today)
      .order('next_training_due');

    const report = {
      report_date: new Date().toISOString(),
      report_period: year,
      summary: {
        total_active_staff: activeStaff.length,
        staff_requiring_training: requireTraining.length,
        staff_trained_this_year: trainedStaff.size,
        compliance_rate: Math.round(complianceRate),
        total_training_sessions: trainingRecords?.length || 0,
        total_training_hours: trainingRecords?.reduce((sum, r) => sum + (r.duration_hours || 0), 0) || 0,
      },
      training_by_type: getTrainingByType(trainingRecords || []),
      staff_needing_training: staffNeedingTraining.map(s => ({
        id: s.id,
        name: s.full_name,
        email: s.email,
        position: s.position,
      })),
      overdue_training: overdueRecords?.map(r => ({
        staff_name: r.staff.full_name,
        staff_email: r.staff.email,
        training_type: r.training_type,
        due_date: r.next_training_due,
        days_overdue: getDaysOverdue(r.next_training_due),
      })) || [],
      training_records: trainingRecords?.map(r => ({
        staff_name: r.staff.full_name,
        staff_email: r.staff.email,
        staff_position: r.staff.position,
        training_type: r.training_type,
        training_date: r.training_date,
        provider: r.training_provider,
        duration_hours: r.duration_hours,
        completion_status: r.completion_status,
        pass_score: r.pass_score,
      })) || [],
    };

    if (format === 'csv') {
      const csv = generateCSV(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="training-compliance-${year}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    logger.error('[TRAINING_COMPLIANCE_REPORT]', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}

function getTrainingByType(records: any[]) {
  const byType: Record<string, number> = {};
  records.forEach(r => {
    byType[r.training_type] = (byType[r.training_type] || 0) + 1;
  });
  return byType;
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function generateCSV(report: any): string {
  const headers = [
    'Staff Name',
    'Email',
    'Position',
    'Training Type',
    'Training Date',
    'Provider',
    'Duration (hours)',
    'Status',
    'Pass Score'
  ];

  const rows = report.training_records.map((r: any) => [
    r.staff_name,
    r.staff_email,
    r.staff_position || '',
    r.training_type,
    r.training_date,
    r.provider || '',
    r.duration_hours || '',
    r.completion_status,
    r.pass_score || ''
  ]);

  const csvContent = [
    `# Training Compliance Report - ${report.report_period}`,
    `# Generated: ${new Date(report.report_date).toLocaleString()}`,
    `# Compliance Rate: ${report.summary.compliance_rate}%`,
    `# Total Staff Trained: ${report.summary.staff_trained_this_year}/${report.summary.staff_requiring_training}`,
    '',
    headers.join(','),
    ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
