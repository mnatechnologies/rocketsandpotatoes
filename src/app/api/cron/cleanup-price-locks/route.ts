import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CLEANUP_PRICE_LOCKS');

export async function GET() {
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