import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { getActiveConnection, createServiceSupabase } from '@/lib/xero/client';
import { syncAllProductsToXero } from '@/lib/xero/inventory';

const logger = createLogger('XERO_ITEMS');

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const supabase = createServiceSupabase();

    // Verify active Xero connection exists
    const connection = await getActiveConnection(supabase);
    if (!connection) {
      return NextResponse.json(
        { error: 'No active Xero connection found' },
        { status: 404 }
      );
    }

    logger.log('Starting bulk product sync to Xero');

    const result = await syncAllProductsToXero(supabase);

    // Fetch total product count for the response
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const total = totalProducts || (result.synced + result.failed);

    logger.log(`Bulk item sync complete: ${result.synced} synced, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      data: {
        total,
        synced: result.synced,
        failed: result.failed,
        failures: result.errors.map((err) => {
          const [productId, ...rest] = err.split(': ');
          return {
            product_id: productId,
            product_name: '',
            error: rest.join(': '),
          };
        }),
      },
    });
  } catch (error: any) {
    logger.error('Failed to sync items to Xero:', error);
    return NextResponse.json(
      { error: 'Failed to sync items to Xero' },
      { status: 500 }
    );
  }
}
