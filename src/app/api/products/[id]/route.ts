import { NextRequest, NextResponse } from 'next/server';
//import { createServerSupabase } from '@/lib/supabase/server';
import {createClient} from "@supabase/supabase-js";
import { createLogger } from '@/lib/utils/logger';
import { isUUID, generateSlug } from '@/lib/utils/slug';

const logger = createLogger('PRODUCT_API');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id: productId} = await params;
  logger.log('Fetching product with ID/slug:', productId);

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
    let product = null;
    let error = null;

    // Check if param is UUID or slug
    if (isUUID(productId)) {
      // Query by ID for backward compatibility
      const result = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      product = result.data;
      error = result.error;
    } else {
      // Query by slug - fetch all products and match by slugified name
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('*');
      
      if (fetchError) {
        error = fetchError;
      } else if (products) {
        // Find product where slugified name matches the slug param
        product = products.find(p => generateSlug(p.name) === productId) || null;
      }
    }

    if (error) {
      logger.error('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Product not found' },
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
