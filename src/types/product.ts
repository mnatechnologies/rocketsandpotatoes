import { MetalSymbol} from "@/lib/metals-api/metalsApi";

export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    calculated_price?: number;
    currency: string;
    weight: string;
    weight_grams: number;
    category: string;
    purity: string;
    rating: number;
    stock: boolean;
    image_url: string;
    metal_type: MetalSymbol;
    form_type?: 'cast' | 'minted' | 'coin' | null;
    brand?: string;
    created_at?: string;
    updated_at?: string;
    slug?: string; // Computed slug for URL generation
  }

export interface PricingConfig {
    id: string;
    markup_percentage: number;
    default_base_fee_percentage: number;
    brand_base_fee_percentages: Record<string, number>;
    updated_at: string;
    created_at: string;
  }
