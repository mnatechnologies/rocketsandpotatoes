import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';

const logger = createLogger('ADMIN_AUDIT_LOGS');

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

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get('action_type');
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      logger.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get distinct action types and entity types for filters
    const { data: actionTypes } = await supabase
      .from('audit_logs')
      .select('action_type')
      .limit(100);

    const { data: entityTypes } = await supabase
      .from('audit_logs')
      .select('entity_type')
      .limit(100);

    const uniqueActionTypes = [...new Set(actionTypes?.map(a => a.action_type) || [])];
    const uniqueEntityTypes = [...new Set(entityTypes?.map(e => e.entity_type) || [])];

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
      filters: {
        actionTypes: uniqueActionTypes,
        entityTypes: uniqueEntityTypes,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}






