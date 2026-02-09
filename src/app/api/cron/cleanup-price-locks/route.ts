import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CLEANUP_PRICE_LOCKS');

export async function GET(req: NextRequest) {
  // Verify cron authorization
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!cronSecret && !isVercelCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Mark expired locks
    const { data, error } = await supabase
      .from('price_locks')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) throw error;

    logger.log('Expired price locks:', data?.length || 0);

    return NextResponse.json({
      success: true,
      expiredCount: data?.length || 0,
    });
  } catch (error) {
    logger.error('Error cleaning up price locks:', error);
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}