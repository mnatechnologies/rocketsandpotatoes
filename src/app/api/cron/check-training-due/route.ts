import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendComplianceAlert } from '@/lib/email/sendComplianceAlert';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger('CRON_CHECK_TRAINING_API')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/cron/check-training-due
// Check for training due soon and send alerts
// Should be called daily via cron
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);
    const in14Days = new Date();
    in14Days.setDate(today.getDate() + 14);
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    // Get training records due soon
    const { data: dueSoon } = await supabase
      .from('staff_training')
      .select(`
        *,
        staff:staff_id (
          id,
          full_name,
          email,
          position,
          is_active,
          requires_aml_training
        )
      `)
      .gte('next_training_due', today.toISOString().split('T')[0])
      .lte('next_training_due', in30Days.toISOString().split('T')[0])
      .eq('staff.is_active', true)
      .eq('staff.requires_aml_training', true);

    // Get overdue training
    const { data: overdue } = await supabase
      .from('staff_training')
      .select(`
        *,
        staff:staff_id (
          id,
          full_name,
          email,
          position,
          is_active,
          requires_aml_training
        )
      `)
      .lt('next_training_due', today.toISOString().split('T')[0])
      .eq('staff.is_active', true)
      .eq('staff.requires_aml_training', true);

    const alerts: any[] = [];

    // Process overdue training
    if (overdue && overdue.length > 0) {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(overdue[0].next_training_due).getTime()) / (1000 * 60 * 60 * 24)
      );

      await sendComplianceAlert({
        type: 'training_overdue',
        severity: 'high',
        title: `AML/CTF Training Overdue - ${overdue.length} Staff Members`,
        description: `${overdue.length} staff member(s) have overdue AML/CTF training. Compliance at risk.`,
        metadata: {
          count: overdue.length,
          staff: overdue.map(t => ({
            name: t.staff.full_name,
            email: t.staff.email,
            training_type: t.training_type,
            due_date: t.next_training_due,
            days_overdue: daysOverdue,
          })),
        },
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/staff`,
      });

      alerts.push({
        type: 'overdue',
        count: overdue.length,
        sent: true,
      });
    }

    // Send alerts for training due in 7 days
    const dueIn7 = dueSoon?.filter(t => {
      const dueDate = new Date(t.next_training_due);
      return dueDate >= today && dueDate <= in7Days;
    });

    if (dueIn7 && dueIn7.length > 0) {
      await sendComplianceAlert({
        type: 'training_due_soon',
        severity: 'medium',
        title: `AML/CTF Training Due in 7 Days - ${dueIn7.length} Staff Members`,
        description: `${dueIn7.length} staff member(s) have AML/CTF training due within the next 7 days.`,
        metadata: {
          count: dueIn7.length,
          days_until_due: 7,
          staff: dueIn7.map(t => ({
            name: t.staff.full_name,
            email: t.staff.email,
            training_type: t.training_type,
            due_date: t.next_training_due,
          })),
        },
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/staff`,
      });

      alerts.push({
        type: 'due_in_7_days',
        count: dueIn7.length,
        sent: true,
      });
    }

    // Send alerts for training due in 14 days
    const dueIn14 = dueSoon?.filter(t => {
      const dueDate = new Date(t.next_training_due);
      return dueDate > in7Days && dueDate <= in14Days;
    });

    if (dueIn14 && dueIn14.length > 0) {
      await sendComplianceAlert({
        type: 'training_due_soon',
        severity: 'low',
        title: `AML/CTF Training Due in 14 Days - ${dueIn14.length} Staff Members`,
        description: `${dueIn14.length} staff member(s) have AML/CTF training due within the next 14 days.`,
        metadata: {
          count: dueIn14.length,
          days_until_due: 14,
          staff: dueIn14.map(t => ({
            name: t.staff.full_name,
            email: t.staff.email,
            training_type: t.training_type,
            due_date: t.next_training_due,
          })),
        },
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/staff`,
      });

      alerts.push({
        type: 'due_in_14_days',
        count: dueIn14.length,
        sent: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Training due date check completed',
      alerts_sent: alerts.length,
      alerts,
      summary: {
        overdue: overdue?.length || 0,
        due_in_7_days: dueIn7?.length || 0,
        due_in_14_days: dueIn14?.length || 0,
        due_in_30_days: dueSoon?.length || 0,
      },
    });
  } catch (error) {
    logger.error('[CHECK_TRAINING_DUE]', error);
    return NextResponse.json(
      { error: 'Failed to check training due dates' },
      { status: 500 }
    );
  }
}
