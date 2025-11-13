import Hero from "@/components/Hero";
import MetalsPricing from "@/components/PriceDisplay";
import PriceTicker from "@/components/PriceTicker";
import ProductShowcase from "@/components/ProductShowcase";
import FeaturedProducts from "@/components/FeaturedProducts";

export default function Home() {
  return (
    <div className="min-h-screen">
      <PriceTicker />
      <Hero />
      <MetalsPricing />
      <FeaturedProducts />
    </div>
  );
}
