import { XeroClient, TokenSet } from 'xero-node';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('XERO_CLIENT');

const XERO_SCOPES = 'openid profile email accounting.transactions accounting.contacts accounting.settings offline_access';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

interface XeroConnection {
  id: string;
  xero_tenant_id: string;
  tenant_name: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  scopes: string;
  connected_by: string;
  connected_at: string;
  is_active: boolean;
  disconnected_at: string | null;
}

export function getXeroClient(): XeroClient {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: XERO_SCOPES.split(' '),
  });
}

export function createServiceSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function getActiveConnection(supabase: SupabaseClient): Promise<XeroConnection | null> {
  const { data, error } = await supabase
    .from('xero_connections')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    logger.log('No active Xero connection found');
    return null;
  }

  return data as XeroConnection;
}

export async function getAuthenticatedClient(supabase: SupabaseClient): Promise<{ xero: XeroClient; tenantId: string } | null> {
  const connection = await getActiveConnection(supabase);
  if (!connection) return null;

  const xero = getXeroClient();
  await xero.initialize();

  const expiresAt = new Date(connection.token_expires_at).getTime();
  const now = Date.now();

  if (expiresAt - now < TOKEN_REFRESH_BUFFER_MS) {
    logger.log('Token expiring soon, refreshing...');
    try {
      const newTokenSet = await xero.refreshWithRefreshToken(
        process.env.XERO_CLIENT_ID!,
        process.env.XERO_CLIENT_SECRET!,
        connection.refresh_token
      );

      xero.setTokenSet(newTokenSet);

      const { error: updateError } = await supabase
        .from('xero_connections')
        .update({
          access_token: newTokenSet.access_token,
          refresh_token: newTokenSet.refresh_token,
          token_expires_at: new Date(Date.now() + (newTokenSet.expires_in ?? 1800) * 1000).toISOString(),
        })
        .eq('id', connection.id);

      if (updateError) {
        logger.error('Failed to update refreshed tokens:', updateError);
      } else {
        logger.log('Token refreshed successfully');
      }
    } catch (err) {
      logger.error('Failed to refresh Xero token:', err);
      return null;
    }
  } else {
    xero.setTokenSet({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      expires_at: expiresAt / 1000,
    } as TokenSet);
  }

  return { xero, tenantId: connection.xero_tenant_id };
}

export function getXeroClientWithState(state: string): XeroClient {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: XERO_SCOPES.split(' '),
    state,
  });
}

export async function buildConsentUrl(state: string): Promise<string> {
  const xero = getXeroClientWithState(state);
  await xero.initialize();
  const consentUrl = await xero.buildConsentUrl();
  return consentUrl;
}

export async function exchangeCodeForTokens(callbackUrl: string, supabase: SupabaseClient, state: string, connectedBy?: string): Promise<XeroConnection> {
  const xero = getXeroClientWithState(state);
  await xero.initialize();

  const tokenSet = await xero.apiCallback(callbackUrl);
  xero.setTokenSet(tokenSet);

  const tenants = await xero.updateTenants(false);
  if (!tenants || tenants.length === 0) {
    throw new Error('No Xero tenants found after authorization');
  }

  const tenant = tenants[0];

  // Deactivate any existing active connections
  await supabase
    .from('xero_connections')
    .update({ is_active: false, disconnected_at: new Date().toISOString() })
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('xero_connections')
    .insert({
      xero_tenant_id: tenant.tenantId,
      tenant_name: tenant.tenantName,
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token,
      token_expires_at: new Date(Date.now() + (tokenSet.expires_in ?? 1800) * 1000).toISOString(),
      scopes: XERO_SCOPES,
      connected_by: connectedBy || null,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    logger.error('Failed to store Xero connection:', error);
    throw new Error('Failed to store Xero connection');
  }

  logger.log('Xero connection established for tenant:', tenant.tenantName);
  return data as XeroConnection;
}

export async function disconnectXero(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from('xero_connections')
    .update({
      is_active: false,
      disconnected_at: new Date().toISOString(),
      access_token: null,
      refresh_token: null,
    })
    .eq('is_active', true);

  if (error) {
    logger.error('Failed to disconnect Xero:', error);
    throw new Error('Failed to disconnect Xero');
  }

  logger.log('Xero disconnected');
}

export async function isXeroConnected(supabase: SupabaseClient): Promise<boolean> {
  const connection = await getActiveConnection(supabase);
  if (!connection) return false;

  const expiresAt = new Date(connection.token_expires_at).getTime();
  // Connection is valid if token hasn't expired (refresh can extend it)
  return expiresAt > Date.now() || !!connection.refresh_token;
}
