import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { getActiveConnection, disconnectXero, createServiceSupabase } from '@/lib/xero/client';

const logger = createLogger('XERO_DISCONNECT');

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const supabase = createServiceSupabase();

    // Check for active connection first
    const connection = await getActiveConnection(supabase);
    if (!connection) {
      return NextResponse.json(
        { error: 'No active Xero connection found' },
        { status: 404 }
      );
    }

    // Attempt to revoke token at Xero (best-effort)
    try {
      await fetch('https://identity.xero.com/connect/revocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: connection.refresh_token,
          client_id: process.env.XERO_CLIENT_ID!,
          client_secret: process.env.XERO_CLIENT_SECRET!,
        }),
      });
      logger.log('Xero token revoked successfully');
    } catch (revokeError: any) {
      // Log but don't block disconnect if revocation fails
      logger.error('Failed to revoke Xero token (continuing with disconnect):', revokeError);
    }

    // Deactivate the connection locally
    await disconnectXero(supabase);

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      user_id: adminCheck.userId,
      action_type: 'xero_disconnected',
      entity_type: 'xero_connection',
      entity_id: connection.id,
      description: `Xero disconnected by admin. Tenant: ${connection.tenant_name}`,
      created_at: new Date().toISOString(),
    });

    logger.log('Xero disconnected by admin:', adminCheck.userId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Xero disconnected successfully',
      },
    });
  } catch (error: any) {
    logger.error('Failed to disconnect Xero:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Xero' },
      { status: 500 }
    );
  }
}
