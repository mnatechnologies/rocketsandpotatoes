import { NextRequest, NextResponse } from 'next/server';
//import { createServerSupabase } from '@/lib/supabase/server';
import {createClient} from "@supabase/supabase-js";

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[PRODUCT_API]', ...args);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id: productId} = await params;
  log('Fetching product with ID:', productId);

  //const supabase = await createServerSupabase();

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

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      log('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Product not found', details: error },
        { status: 404 }
      );
    }

    if (!product) {
      log('Product not found');
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    log('Product fetched successfully:', product.name);
    return NextResponse.json(product);
  } catch (err) {
    log('Exception fetching product:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err },
      { status: 500 }
    );
  }
}
