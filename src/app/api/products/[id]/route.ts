import { NextRequest, NextResponse } from 'next/server';
//import { createServerSupabase } from '@/lib/supabase/server';
import {createClient} from "@supabase/supabase-js";
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('PRODUCT_API');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id: productId} = await params;
  logger.log('Fetching product with ID:', productId);

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
      logger.error('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Product not found', details: error },
        { status: 404 }
      );
    }

    if (!product) {
      logger.log('Product not found');
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    logger.log('Product fetched successfully:', product.name);
    return NextResponse.json(product);
  } catch (err) {
    logger.error('Exception fetching product:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err },
      { status: 500 }
    );
  }
}
