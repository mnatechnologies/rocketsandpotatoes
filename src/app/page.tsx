import Hero from "@/components/Hero";
import MetalsPricing from "@/components/PriceDisplay";
import PriceTicker from "@/components/PriceTicker";
import  ProductShowcase from  "@/components/ProductShowcase";

export default function Home() {
  return (
    <div className="min-h-screen">
      <PriceTicker />
      <Hero />
      <MetalsPricing />
      <ProductShowcase />
    </div>
  );
}
