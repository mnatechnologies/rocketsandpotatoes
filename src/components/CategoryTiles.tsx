import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = [
  {
    name: 'Gold',
    href: '/products?category=Gold',
    description: 'Investment-grade gold bars and coins',
    image: '/metals/katie-harp-Em96eDRJPD8-unsplash.jpg',
  },
  {
    name: 'Silver',
    href: '/products?category=Silver',
    description: 'Silver bullion, coins and bars',
    image: '/metals/katie-harp-TnQE5X48FMA-unsplash.jpg',
  },
  {
    name: 'Platinum',
    href: '/products?category=Platinum',
    description: 'Rare platinum bars and coins',
    image: '/metals/platinum and palladium texture.....jpg',
  },
  {
    name: 'Palladium',
    href: '/products?category=Palladium',
    description: 'Premium palladium products',
    image: '/metals/_palladium texture.jpg',
  },
];

export default function CategoryTiles() {
  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Shop by Metal
          </h2>
          <p className="text-base text-muted-foreground mt-2">
            Browse our range of investment-grade precious metals
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group block"
            >
              <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-[var(--radius)] border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                {/* Background texture image */}
                <Image
                  src={cat.image}
                  alt={`${cat.name} texture`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Gradient overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/70 group-hover:via-black/15" />

                {/* Subtle top vignette for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

                {/* Text content pinned to bottom */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-0.5">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-white/70 leading-snug">
                    {cat.description}
                  </p>
                </div>

                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-[var(--radius)] ring-1 ring-white/0 group-hover:ring-white/10 transition-all duration-300 pointer-events-none" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
