import Link from 'next/link';
import { Shield, TrendingUp, Gem, CircleDollarSign } from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Gold',
    href: '/products?category=Gold',
    description: 'Investment-grade gold bars and coins',
    icon: CircleDollarSign,
    gradient: 'from-amber-500/20 to-yellow-600/10',
    iconColor: 'text-amber-500',
  },
  {
    name: 'Silver',
    href: '/products?category=Silver',
    description: 'Silver bullion, coins and bars',
    icon: Shield,
    gradient: 'from-slate-400/20 to-gray-500/10',
    iconColor: 'text-slate-400',
  },
  {
    name: 'Platinum',
    href: '/products?category=Platinum',
    description: 'Rare platinum bars and coins',
    icon: Gem,
    gradient: 'from-cyan-400/20 to-teal-500/10',
    iconColor: 'text-cyan-400',
  },
  {
    name: 'Palladium',
    href: '/products?category=Palladium',
    description: 'Premium palladium products',
    icon: TrendingUp,
    gradient: 'from-violet-400/20 to-purple-500/10',
    iconColor: 'text-violet-400',
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
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className="group block"
              >
                <div className={`relative overflow-hidden rounded-xl border border-border bg-card p-6 lg:p-8 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-50 group-hover:opacity-80 transition-opacity`} />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center mb-4 ${cat.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
