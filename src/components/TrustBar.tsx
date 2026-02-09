import { Shield, Lock, Truck, Flag } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: Shield, label: 'AUSTRAC Registered' },
  { icon: Lock, label: 'Secure Checkout' },
  { icon: Truck, label: 'Insured Delivery' },
  { icon: Flag, label: 'Australian Owned' },
];

export default function TrustBar() {
  return (
    <section className="py-6 bg-muted/40 border-y border-border">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:gap-x-16">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2.5">
                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
