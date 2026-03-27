'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/account', label: 'Dashboard' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/settings', label: 'Settings' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Account header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">My Account</h1>
          <p className="text-muted-foreground">Manage your orders and account details</p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 border-b border-border mb-8">
          {navItems.map((item) => {
            const isActive =
              item.href === '/account'
                ? pathname === '/account'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
