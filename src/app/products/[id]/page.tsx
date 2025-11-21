import {createServerSupabase} from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { Product } from '@/types/product';
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('PRODUCT_PAGE')

export default async function ProductDetailPage({params}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // Fetch product from database
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    logger.error('[PRODUCT_DETAIL] Error fetching product:', error);
    notFound();
  }

  // Construct full image URL
  const trimmedImageUrl = product.image_url?.trim();
  const fullImageUrl = trimmedImageUrl
    ? `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/gold/${trimmedImageUrl}`
    : '/anblogo.png';

  const productWithUrl: Product = {
    ...product,
    image_url: fullImageUrl
  };

  return <ProductDetailClient product={productWithUrl} />;
}
