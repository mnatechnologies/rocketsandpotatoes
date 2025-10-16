interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  weight: string;
  purity: string;
  rating: number;
  inStock: boolean;
  image: string;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(value);
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductShowcase() {
  const products: Product[] = [
    { id: "1", name: "1oz Gold Kangaroo Coin", price: 4299.99, description: "Australian legal tender gold coin with 99.99% purity", weight: "1 troy oz", purity: "99.99%", rating: 4.9, inStock: true, image: "🥇" },
    { id: "2", name: "10oz Silver Bar", price: 649.99, description: "Perth Mint cast silver bar with certificate", weight: "10 troy oz", purity: "99.9%", rating: 4.8, inStock: true, image: "🥈" },
    { id: "3", name: "1/4oz Platinum Coin", price: 425.5, description: "Australian Platinum Koala coin, limited edition", weight: "0.25 troy oz", purity: "99.95%", rating: 4.7, inStock: false, image: "⚡" },
    { id: "4", name: "100g Gold Bar", price: 8850.0, description: "PAMP Suisse gold bar with assay certificate", weight: "100 grams", purity: "99.99%", rating: 5.0, inStock: true, image: "🟨" },
  ];

  return (
    <section id="products" className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our premium selection of precious metals from trusted refineries worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group hover:shadow-premium transition-all duration-300 hover:scale-[1.02] bg-card/10 backdrop-blur-sm rounded-2xl p-6 border border-border">
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {product.image}
                </div>
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <Stars rating={product.rating} />
                  <span className="text-sm text-muted-foreground ml-1">({product.rating})</span>
                </div>
              </div>

              <div className="space-y-2 text-sm mt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{product.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purity:</span>
                  <span className="font-medium">{product.purity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${product.inStock ? "text-success" : "text-destructive"}`}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="text-2xl font-bold text-center mb-4">{formatPrice(product.price)}</div>
                <button
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-md transition-smooth ${
                    product.inStock
                      ? "bg-primary text-primary-foreground shadow-gold hover:opacity-95"
                      : "border border-border text-foreground hover:bg-muted/30"
                  }`}
                  disabled={!product.inStock}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  {product.inStock ? "Add to Cart" : "Notify When Available"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
