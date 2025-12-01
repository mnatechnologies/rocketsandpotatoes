import { NextRequest, NextResponse } from 'next/server';
// import { createServerSupabase } from '@/lib/supabase/server';
import {createClient} from "@supabase/supabase-js";
import { calculateBulkPricing} from "@/lib/pricing/priceCalculations";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger('PRODUCT_PRICING_API');

const LOCK_DURATION_MS = 15 * 60 * 1000; 

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    // const supabase = await createServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');
    const productIds: string[] = idsParam ? idsParam.split(',') : [];
    const supabase = getSupabase();
    const currency = searchParams.get('currency') || 'USD';


    let query = supabase
      .from('products')
      .select('*');

    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
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

    let fxRate = 1;
    if (currency === 'AUD') {
      const fxResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/fx-rate?from=USD&to=AUD`);
      const fxData = await fxResponse.json();
      fxRate = fxData.rate;
    }


    // Calculate live prices
    const priceMap = await calculateBulkPricing(products);

    // Combine product data with calculated prices
    const productsWithPricing = products.map((product) => {
      const calculatedPrice = priceMap.get(product.id);
      const basePrice = product.price || product.base_price || 0;

      const trimmedImageUrl = product.image_url?.trim();
      const fullImageUrl = trimmedImageUrl
        ? `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/${product.category.toLowerCase()}/${product.form_type ?`${product.form_type}/` : ''}${trimmedImageUrl}`
        : null;


      return {
        id: product.id,
        name: product.name,
        category: product.category,
        weight: product.weight,
        purity: product.purity,
        image_url: fullImageUrl,
        base_price: basePrice * fxRate,
        calculated_price: (calculatedPrice || basePrice) * fxRate,
        price_difference: calculatedPrice ? (calculatedPrice - basePrice) * fxRate : 0,
        currency: currency,
        fx_rate: fxRate,
      };
    });

    return NextResponse.json({
      success: true,
      data: productsWithPricing,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching product pricing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { sessionId, customerId, products, currency = "USD" } = await request.json();


    let fxRate = 1;
    if (currency === 'AUD') {
      const fxResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/fx-rate?from=USD&to=AUD`);
      const fxData = await fxResponse.json();
      fxRate = fxData.rate;
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Products required' },
        { status: 400 }
      );
    }

    const productIds = products.map((p: { productId: string }) => p.productId);

    // Fetch products from DB
    const { data: dbProducts, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (fetchError) throw fetchError;

    if (!dbProducts || dbProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Products not found' },
        { status: 404 }
      );
    }

    // Calculate prices server-side (this is the secure part)
    const priceMap = await calculateBulkPricing(dbProducts);

    // Clear any existing active locks for this session
    await supabase
      .from('price_locks')
      .update({ status: 'expired' })
      .eq('session_id', sessionId)
      .eq('status', 'active');

    // Create new locks
    const expiresAt = new Date(Date.now() + LOCK_DURATION_MS);
    const locksToInsert = dbProducts.map((product) => ({
      session_id: sessionId,
      customer_id: customerId || null,
      product_id: product.id,
      locked_price: (priceMap.get(product.id) || product.price) * fxRate,
      currency: currency,
      metal_type: product.metal_type,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    }));

    const { data: insertedLocks, error: insertError } = await supabase
      .from('price_locks')
      .insert(locksToInsert)
      .select();

    if (insertError) throw insertError;

    logger.log('Price locks created:', { sessionId, count: insertedLocks?.length });

    // Return locked prices to client
    const lockedPrices = dbProducts.map((product) => ({
      productId: product.id,
      price: priceMap.get(product.id) || product.price,
    }));

    return NextResponse.json({
      success: true,
      lockId: insertedLocks?.[0]?.id,
      expiresAt: expiresAt.toISOString(),
      lockedPrices,
    });
  } catch (error) {
    logger.error('Error locking prices:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('price_locks')
      .update({ status: 'expired' })
      .eq('session_id', sessionId)
      .eq('status', 'active');

    if (error) throw error;

    logger.log('Price locks cleared:', { sessionId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error clearing price locks:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}