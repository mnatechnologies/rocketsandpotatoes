import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/utils/logger';
import { generateSlug } from '@/lib/utils/slug';

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

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').replace(/[%_\\]/g, '');
  const metalType = searchParams.get('metal_type') || '';
  const stockFilter = searchParams.get('stock') || 'all';

  logger.log('Fetching products', { search, metalType, stockFilter });

  try {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (metalType && metalType !== 'all') {
      query = query.eq('metal_type', metalType);
    }

    if (stockFilter === 'in_stock') {
      query = query.eq('stock', true);
    } else if (stockFilter === 'out_of_stock') {
      query = query.eq('stock', false);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    logger.error('Exception fetching products:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

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
      slug: providedSlug,
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

    const slug = providedSlug?.trim() || generateSlug(name);

    logger.log('Creating product:', name);

    const { data, error } = await supabase
      .from('products')
      .insert({
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
        slug,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating product:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    logger.log('Product created:', data.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    logger.error('Exception creating product:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
