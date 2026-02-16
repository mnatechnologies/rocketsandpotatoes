import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { createServiceSupabase } from '@/lib/xero/client';
import { syncStockAdjustmentToXero } from '@/lib/xero/inventory';

const logger = createLogger('STOCK_ADJUSTMENTS');

const VALID_ADJUSTMENT_TYPES = ['write_off', 'damaged', 'correction', 'other'] as const;

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const supabase = createServiceSupabase();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const adjustmentType = searchParams.get('adjustment_type');
    const syncStatus = searchParams.get('sync_status');

    let query = supabase
      .from('stock_adjustments')
      .select('*, products(name, slug, sku)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (adjustmentType) {
      query = query.eq('adjustment_type', adjustmentType);
    }

    if (syncStatus) {
      query = query.eq('sync_status', syncStatus);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch stock adjustments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stock adjustments' },
        { status: 500 }
      );
    }

    // Supabase returns joined data as an object for single FK joins
    const adjustments = (data || []).map((row: any) => {
      const { products, ...adjustment } = row;
      return {
        ...adjustment,
        product: products || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        adjustments,
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch stock adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock adjustments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const supabase = createServiceSupabase();
    const body = await req.json();

    const { product_id, adjustment_type, reason, notes } = body;

    // Validate required fields
    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    if (!adjustment_type) {
      return NextResponse.json(
        { error: 'Invalid adjustment_type: must be one of write_off, damaged, correction, other' },
        { status: 400 }
      );
    }

    if (!VALID_ADJUSTMENT_TYPES.includes(adjustment_type)) {
      return NextResponse.json(
        { error: 'Invalid adjustment_type: must be one of write_off, damaged, correction, other' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { error: 'reason must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (notes && notes.length > 2000) {
      return NextResponse.json(
        { error: 'notes must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Insert stock adjustment
    const { data: adjustment, error: insertError } = await supabase
      .from('stock_adjustments')
      .insert({
        product_id,
        adjustment_type,
        reason,
        notes: notes || null,
        adjusted_by: adminCheck.userId,
        sync_status: 'pending',
      })
      .select()
      .single();

    if (insertError || !adjustment) {
      logger.error('Failed to create stock adjustment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create stock adjustment' },
        { status: 500 }
      );
    }

    // Attempt Xero sync (best-effort, don't block on failure)
    try {
      await syncStockAdjustmentToXero(adjustment.id, supabase);
    } catch (syncError: any) {
      logger.error('Xero sync failed for stock adjustment (continuing):', syncError);
    }

    // Re-fetch the adjustment to get updated sync status
    const { data: updatedAdjustment } = await supabase
      .from('stock_adjustments')
      .select('*')
      .eq('id', adjustment.id)
      .single();

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      user_id: adminCheck.userId,
      action_type: 'stock_adjustment_created',
      entity_type: 'stock_adjustment',
      entity_id: adjustment.id,
      description: `Stock adjustment created: ${adjustment_type} - ${reason}`,
      metadata: { product_id, adjustment_type, reason },
      created_at: new Date().toISOString(),
    });

    logger.log('Stock adjustment created:', adjustment.id);

    return NextResponse.json(
      {
        success: true,
        data: updatedAdjustment || adjustment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Failed to create stock adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to create stock adjustment' },
      { status: 500 }
    );
  }
}
