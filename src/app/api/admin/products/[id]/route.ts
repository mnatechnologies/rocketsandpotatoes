import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ADMIN_PRODUCTS');

const VALID_METAL_TYPES = ['gold', 'silver', 'platinum', 'palladium'];
const VALID_FORM_TYPES = ['bar', 'coin', 'round'];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { id } = await params;
  logger.log('Fetching product:', id);

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error('Exception fetching product:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      name,
      description,
      metal_type,
      weight,
      purity,
      category,
      form_type,
      brand,
      price,
      stock,
      image_url,
      slug,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!metal_type || !VALID_METAL_TYPES.includes(metal_type)) {
      return NextResponse.json({ error: `Metal type must be one of: ${VALID_METAL_TYPES.join(', ')}` }, { status: 400 });
    }
    if (form_type && !VALID_FORM_TYPES.includes(form_type)) {
      return NextResponse.json({ error: `Form type must be one of: ${VALID_FORM_TYPES.join(', ')}` }, { status: 400 });
    }
    if (price === undefined || price === null || Number(price) <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
    }
    if (image_url && !/^https?:\/\//.test(image_url.trim())) {
      return NextResponse.json({ error: 'Image URL must start with http:// or https://' }, { status: 400 });
    }

    logger.log('Updating product:', id);

    // Build update payload — preserve existing slug if not provided
    const updatePayload: Record<string, unknown> = {
      name: name.trim(),
      description: description?.trim() || null,
      metal_type,
      weight: weight?.trim() || null,
      purity: purity?.trim() || null,
      category: category || metal_type,
      form_type: form_type || null,
      brand: brand?.trim() || null,
      price: Number(price),
      stock: stock ?? true,
      image_url: image_url?.trim() || null,
    };
    // Only update slug if explicitly provided (don't null it out)
    if (slug !== undefined && slug !== null && slug.trim()) {
      updatePayload.slug = slug.trim();
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating product:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    logger.log('Product updated:', id);
    return NextResponse.json({ data });
  } catch (err) {
    logger.error('Exception updating product:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { stock } = body;

    if (typeof stock !== 'boolean') {
      return NextResponse.json({ error: 'stock must be a boolean' }, { status: 400 });
    }

    logger.log('Toggling stock for product:', id, stock);

    const { data, error } = await supabase
      .from('products')
      .update({ stock })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error toggling stock:', error);
      // PGRST116 = no rows matched
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update stock status' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error('Exception toggling stock:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { id } = await params;
  logger.log('Deleting product:', id);

  try {
    const { data: deleted, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      logger.error('Error deleting product:', error);
      // FK violation — product has active price locks or other references
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Cannot delete product: it has active references (e.g. price locks)' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    logger.log('Product deleted:', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Exception deleting product:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
