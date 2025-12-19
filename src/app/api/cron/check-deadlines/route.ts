import { NextRequest, NextResponse } from 'next/server';
import { runDeadlineChecks } from '@/lib/compliance/deadline-checker';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CRON_DEADLINE_CHECK');

/**
 * Cron endpoint to check for approaching TTR/SMR deadlines and send alerts.
 * 
 * This endpoint should be called daily by a cron scheduler.
 * 
 * For Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-deadlines",
 *     "schedule": "0 8 * * *"  // 8 AM UTC daily (adjust for AEST)
 *   }]
 * }
 * 
 * For external schedulers (AWS CloudWatch, etc.), call this endpoint with:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, require authorization
  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.log('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Vercel Cron also sends a special header
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  
  if (!cronSecret && !isVercelCron) {
    // In production without cron secret and not from Vercel, reject
    if (process.env.NODE_ENV === 'production') {
      logger.log('Cron endpoint called without authorization in production');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  logger.log('Running deadline checks via cron...');

  try {
    const result = await runDeadlineChecks();

    return NextResponse.json({
      success: true,
      message: 'Deadline checks completed',
      ttrAlertsSent: result.ttrAlertsSent,
      smrAlertsSent: result.smrAlertsSent,
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Deadline check cron failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(req: NextRequest) {
  return GET(req);
}









