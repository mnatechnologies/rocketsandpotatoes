import { NextRequest, NextResponse } from 'next/server';
// import { createServerSupabase } from '@/lib/supabase/server';
import {createClient} from "@supabase/supabase-js";
import { calculateBulkPricing} from "@/lib/pricing/priceCalculations";

export async function GET(request: NextRequest) {
  try {
    // const supabase = await createServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');
    const productIds: string[] = idsParam ? idsParam.split(',') : [];

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

    let query = supabase
      .from('products')
      .select('*');

    if (productIds && productIds.length > 0) {
      const { data: products, error } = await query.in('id', productIds);
    }

    const { data: products, error } = await query;

    if (error) {
      throw error;
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products found' },
        { status: 404 }
      );
    }

    // Calculate live prices
    const priceMap = await calculateBulkPricing(products);

    // Combine product data with calculated prices
    const productsWithPricing = products.map((product) => {
      const calculatedPrice = priceMap.get(product.id);
      const basePrice = product.price || product.base_price || 0;

      const trimmedImageUrl = product.image_url?.trim();
      const fullImageUrl = trimmedImageUrl
        ? supabase.storage.from('Images').getPublicUrl(`gold/${trimmedImageUrl}`).data.publicUrl
        : null;


      return {
        id: product.id,
        name: product.name,
        category: product.category,
        weight: product.weight,
        purity: product.purity,
        image_url: fullImageUrl,
        base_price: basePrice,
        calculated_price: calculatedPrice || basePrice,
        price_difference: calculatedPrice ? calculatedPrice - basePrice : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: productsWithPricing,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching product pricing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}