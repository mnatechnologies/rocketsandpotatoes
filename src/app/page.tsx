import Hero from "@/components/Hero";
import { createServerSupabase } from '@/lib/supabase/server';
import FeaturedProductsWrapper from "@/components/FeaturedProductsWrapper";
import TextSection from "@/components/TextSection";
import CategoryTiles from "@/components/CategoryTiles";
import TrustBar from "@/components/TrustBar";

export default async function Home() {
  const supabase = await createServerSupabase();

  // Fetch random featured products from different metal types
  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .eq('stock', true);

  // Shuffle and select 4 random products with variety
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Try to get variety in metal types
  const products = allProducts ? (() => {
    const byMetalType = allProducts.reduce((acc, product) => {
      const type = product.metal_type || 'OTHER';
      if (!acc[type]) acc[type] = [];
      acc[type].push(product);
      return acc;
    }, {} as Record<string, typeof allProducts>);

    // Get one product from each metal type if possible
    const selected: typeof allProducts = [];
    const metalTypes = Object.keys(byMetalType);
    const shuffledTypes = shuffleArray(metalTypes);

    // First pass: one from each metal type
    shuffledTypes.forEach(type => {
      if (selected.length < 4 && byMetalType[type].length > 0) {
        const randomProduct = byMetalType[type][Math.floor(Math.random() * byMetalType[type].length)];
        selected.push(randomProduct);
      }
    });

    // Second pass: fill remaining slots with random products
    if (selected.length < 4) {
      const remaining = shuffleArray(allProducts.filter(p => !selected.includes(p)));
      selected.push(...remaining.slice(0, 4 - selected.length));
    }

    return shuffleArray(selected).slice(0, 4);
  })() : [];

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
      <TrustBar />
      <CategoryTiles />
      <TextSection />
      <FeaturedProductsWrapper products={featuredProducts}/>
    </div>
  );
}
