import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET() {
  const [productsResult, haltResult] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('stock', true)
      .order('category', { ascending: true })
      .order('price', { ascending: true }),
    supabase
      .from('sales_halt')
      .select('metal_type, is_halted'),
  ]);

  if (productsResult.error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  const haltRows = haltResult.data || [];
  const globalHalted = haltRows.some((row) => row.metal_type === 'ALL' && row.is_halted);
  const haltedMetals = new Set(
    haltRows.filter((row) => row.is_halted).map((row) => row.metal_type)
  );

  const products = productsResult.data.map((product) => ({
    ...product,
    sales_halted: globalHalted || haltedMetals.has(product.metal_type),
  }));

  return NextResponse.json(products);
}