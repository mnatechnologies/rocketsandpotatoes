import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('stock', true)
    .order('category', { ascending: true })
    .order('price', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  return NextResponse.json(products);
}