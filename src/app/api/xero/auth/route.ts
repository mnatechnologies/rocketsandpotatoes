import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { buildConsentUrl } from '@/lib/xero/client';

const logger = createLogger('XERO_AUTH');

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const state = crypto.randomBytes(32).toString('hex');
    const consentUrl = await buildConsentUrl(state);

    logger.log('Redirecting admin to Xero consent URL');

    const response = NextResponse.redirect(consentUrl);
    response.cookies.set('xero_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/api/xero/callback',
    });

    return response;
  } catch (error: any) {
    logger.error('Failed to initiate Xero authorization:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Xero authorization' },
      { status: 500 }
    );
  }
}
