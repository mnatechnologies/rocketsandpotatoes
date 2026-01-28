import {createServerSupabase} from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { Product } from '@/types/product';
import { createLogger } from '@/lib/utils/logger'
import { isUUID, generateSlug } from '@/lib/utils/slug';

const logger = createLogger('PRODUCT_PAGE')

export default async function ProductDetailPage({params}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  let product: Product | null = null;
  let error: any = null;

  // Check if param is UUID or slug
  if (isUUID(id)) {
    // Query by ID for backward compatibility
    const result = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
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
      product = products.find(p => generateSlug(p.name) === id) || null;
    }
  }

  if (error || !product) {
    logger.error('[PRODUCT_DETAIL] Error fetching product:', error);
    notFound();
  }

  // Construct full image URL
  const trimmedImageUrl = product.image_url?.trim();
  const fullImageUrl = trimmedImageUrl
    ? `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/${product.category.toLowerCase()}/${product.form_type ? `${product.form_type}/` : ''}${trimmedImageUrl}`
    : '/anblogo.png';

  const productWithUrl: Product = {
    ...product,
    image_url: fullImageUrl
  };

  return <ProductDetailClient product={productWithUrl} />;
}
