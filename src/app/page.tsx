import Hero from "@/components/Hero";
import MetalsPricing from "@/components/PriceDisplay";
import { createServerSupabase } from '@/lib/supabase/server';
import FeaturedProductsWrapper from "@/components/FeaturedProductsWrapper";

export default async function Home() {
  const supabase = await createServerSupabase();

  // Fetch featured products (first 4 products)
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('stock', true)
    .order('category', { ascending: true })
    .order('price', { ascending: true })
    .limit(4);

  // Transform products with image URLs
  const featuredProducts = products?.map(product => {
    const trimmedImageUrl = product.image_url?.trim();
    const imageUrl = trimmedImageUrl
     ? `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/${product.category.toLowerCase()}/${product.form_type ?`${product.form_type}/` : ''}${trimmedImageUrl}`
      : null;

    return {
      ...product,
      image_url: imageUrl
    };
  }) || [];

  return (
    <div className="min-h-screen">
      <Hero />
      <MetalsPricing />
      <FeaturedProductsWrapper products={featuredProducts}/>
    </div>
  );
}
