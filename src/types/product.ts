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
    form_type?: 'cast' | 'minted' | null;
    created_at?: string;
    updated_at?: string;
    slug?: string; // Computed slug for URL generation
  }
