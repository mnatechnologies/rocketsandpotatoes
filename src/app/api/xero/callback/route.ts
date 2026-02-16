import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { exchangeCodeForTokens, createServiceSupabase } from '@/lib/xero/client';

const logger = createLogger('XERO_CALLBACK');

const INTEGRATIONS_URL = '/admin/integrations';

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { searchParams } = new URL(req.url);
  const error = searchParams.get('error');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // If Xero returned an error (e.g., user denied consent)
  if (error) {
    logger.error('Xero returned error:', error);
    return NextResponse.redirect(
      new URL(`${INTEGRATIONS_URL}?xero=error&message=${error}`, req.url)
    );
  }

  // Validate CSRF state
  const storedState = req.cookies.get('xero_oauth_state')?.value;
  if (!storedState || !state || storedState !== state) {
    logger.error('CSRF state mismatch in Xero callback');
    return NextResponse.redirect(
      new URL(`${INTEGRATIONS_URL}?xero=error&message=invalid_state`, req.url)
    );
  }

  if (!code) {
    logger.error('No authorization code in callback');
    return NextResponse.redirect(
      new URL(`${INTEGRATIONS_URL}?xero=error&message=missing_code`, req.url)
    );
  }

  try {
    const supabase = createServiceSupabase();

    // exchangeCodeForTokens expects the full callback URL to extract the code
    await exchangeCodeForTokens(req.url, supabase, state, adminCheck.userId ?? undefined);

    logger.log('Xero OAuth callback processed successfully');

    const response = NextResponse.redirect(
      new URL(`${INTEGRATIONS_URL}?xero=connected`, req.url)
    );
    // Clear the state cookie
    response.cookies.delete('xero_oauth_state');

    return response;
  } catch (err: any) {
    logger.error('Xero callback processing failed:', err);

    const message = err.message?.includes('store')
      ? 'connection_failed'
      : 'token_exchange_failed';

    return NextResponse.redirect(
      new URL(`${INTEGRATIONS_URL}?xero=error&message=${message}`, req.url)
    );
  }
}
