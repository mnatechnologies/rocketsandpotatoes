import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getRetentionReport } from '@/lib/compliance/retention';
import { createLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const logger = createLogger('ADMIN_RETENTION');

export async function GET(_req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error!;

  try {
    const report = await getRetentionReport();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to generate retention report:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
