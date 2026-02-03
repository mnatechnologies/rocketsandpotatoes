import { NextRequest, NextResponse } from 'next/server';
// import { createServerSupabase } from '@/lib/supabase/server';
import {createClient} from "@supabase/supabase-js";
import { calculateBulkPricing} from "@/lib/pricing/priceCalculations";
import { createLogger } from "@/lib/utils/logger";
import { fetchFxRate } from '@/lib/metals-api/metalsApi';


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
    try {
      const result = await fetchFxRate('USD', 'AUD');
      fxRate = result.rate;
      logger.log('✅ FX rate fetched:', fxRate);
    } catch (error) {
      logger.error('Failed to fetch FX rate:', error);
      fxRate = 1.57; // Fallback only if API fails
    }


    // ✅ Calculate live prices (NO FALLBACK!)
    const priceMap = await calculateBulkPricing(products);

    // ✅ Combine product data with calculated prices - fail if no price available
    const productsWithPricing = products.map((product) => {
      const calculatedPrice = priceMap.get(product.id);

      // ❌ NO FALLBACK - if we can't calculate live price, we can't display it
      if (!calculatedPrice) {
        logger.error(`No live price available for product ${product.id} (${product.name})`);
        throw new Error(`Unable to calculate live price for ${product.name}. Please try again.`);
      }

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
        // ✅ Only calculated price in both currencies
        calculated_price: calculatedPrice * fxRate,
        price_usd: calculatedPrice,
        price_aud: calculatedPrice * fxRate,
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

    logger.log('POST /api/products/pricing called:', { sessionId, currency, productCount: products?.length });

    // ✅ Always fetch FX rate for dual currency storage
    let fxRate = 1;
    try {
      const result = await fetchFxRate('USD', 'AUD');
      fxRate = result.rate;
      logger.log('✅ FX rate fetched:', fxRate);
    } catch (error) {
      logger.error('Failed to fetch FX rate:', error);
      fxRate = 1.57; // Fallback only if API fails
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

    // ✅ Calculate live prices in USD (no fallback!)
    const priceMap = await calculateBulkPricing(dbProducts);

    const { data: existingLocks } = await supabase
      .from('price_locks')
      .select('expires_at')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .limit(1);

    const existingExpiry = existingLocks?.[0]?.expires_at
      ? new Date(existingLocks[0].expires_at)
      : null;

    const expiresAt = existingExpiry && existingExpiry > new Date()
      ? existingExpiry
      : new Date(Date.now() + LOCK_DURATION_MS);

    // Clear any existing active locks for this session
    await supabase
      .from('price_locks')
      .update({ status: 'expired' })
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .in('product_id', productIds);

    // ✅ Create new locks with BOTH currencies (single source of truth)
    const locksToInsert = dbProducts.map((product) => {
      const priceUSD = priceMap.get(product.id);

      // ❌ NO FALLBACK - if no live price, we can't lock
      if (!priceUSD) {
        throw new Error(`Unable to calculate price for product ${product.id} (${product.name})`);
      }

      const priceAUD = priceUSD * fxRate;

      return {
        session_id: sessionId,
        customer_id: customerId || null,
        product_id: product.id,
        // ✅ Store BOTH currencies with the SAME FX rate
        locked_price_usd: priceUSD,
        locked_price_aud: priceAUD,
        fx_rate: fxRate,
        currency: currency,
        metal_type: product.metal_type,
        expires_at: expiresAt.toISOString(),
        status: 'active',
      };
    });

    const { data: insertedLocks, error: insertError } = await supabase
      .from('price_locks')
      .insert(locksToInsert)
      .select();

    if (insertError) throw insertError;

    logger.log('✅ Price locks created:', {
      sessionId,
      count: insertedLocks?.length,
      currency,
      fxRate,
      sampleLock: insertedLocks?.[0] ? {
        product_id: insertedLocks[0].product_id,
        locked_price_usd: insertedLocks[0].locked_price_usd,
        locked_price_aud: insertedLocks[0].locked_price_aud,
        fx_rate: insertedLocks[0].fx_rate,
      } : null
    });

    // ✅ Return locked prices in user's selected currency
    const lockedPrices = dbProducts.map((product) => {
      const priceUSD = priceMap.get(product.id);
      if (!priceUSD) {
        throw new Error(`Missing price for product ${product.id}`);
      }

      return {
        productId: product.id,
        price: currency === 'AUD' ? priceUSD * fxRate : priceUSD,
        priceUSD: priceUSD,
        priceAUD: priceUSD * fxRate,
        currency: currency,
      };
    });

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