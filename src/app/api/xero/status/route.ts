import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { getActiveConnection, createServiceSupabase } from '@/lib/xero/client';

const logger = createLogger('XERO_STATUS');

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const supabase = createServiceSupabase();

    const connection = await getActiveConnection(supabase);

    // Fetch recent sync history (last 20 entries)
    const { data: syncHistory, error: syncError } = await supabase
      .from('xero_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (syncError) {
      logger.error('Failed to fetch sync history:', syncError);
    }

    // Fetch sync summary counts
    const { count: total } = await supabase
      .from('xero_sync_log')
      .select('*', { count: 'exact', head: true });

    const { count: successCount } = await supabase
      .from('xero_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'success');

    const { count: failedCount } = await supabase
      .from('xero_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'failed');

    const { count: pendingCount } = await supabase
      .from('xero_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'pending');

    const connectionData = connection
      ? {
          id: connection.id,
          tenant_name: connection.tenant_name,
          xero_tenant_id: connection.xero_tenant_id,
          connected_at: connection.connected_at,
          connected_by: connection.connected_by,
          scopes: connection.scopes,
          token_expires_at: connection.token_expires_at,
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        connected: !!connection,
        connection: connectionData,
        sync_history: syncHistory || [],
        sync_summary: {
          total: total || 0,
          success: successCount || 0,
          failed: failedCount || 0,
          pending: pendingCount || 0,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch Xero status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Xero status' },
      { status: 500 }
    );
  }
}
