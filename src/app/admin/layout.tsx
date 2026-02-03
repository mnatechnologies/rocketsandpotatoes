'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { BreadcrumbItem } from '@/components/Breadcrumb';

// Define breadcrumb mappings for admin routes
const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/document-verification': 'Document Verification',
  '/admin/reviews': 'Transaction Reviews',
  '/admin/edd-investigations': 'EDD Investigations',
  '/admin/edd-reviews': 'EDD Reviews',
  '/admin/ttr-reports': 'TTR Reports',
  '/admin/suspicious-reports': 'Suspicious Reports',
  '/admin/staff': 'Staff Training',
  '/admin/reports': 'Reports & Analytics',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/pricing': 'Pricing Configuration',
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Home
  breadcrumbs.push({
    label: 'Home',
    href: '/',
  });

  // Build path progressively
  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const fullPath = currentPath;

    // Check if this is an admin route
    if (fullPath.startsWith('/admin')) {
      if (fullPath === '/admin') {
        breadcrumbs.push({
          label: 'Admin',
          href: '/admin',
        });
      } else if (breadcrumbMap[fullPath]) {
        breadcrumbs.push({
          label: breadcrumbMap[fullPath],
        });
      } else {
        // Handle dynamic routes or unknown admin routes
        const routeSegment = segments[i];
        const readableLabel = routeSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        breadcrumbs.push({
          label: readableLabel,
        });
      }
    }
  }

  return breadcrumbs;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-card border-b border-border px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link
                href="/admin"
                className="text-primary hover:text-primary/80 font-semibold text-base sm:text-lg flex-shrink-0"
              >
                Admin Dashboard
              </Link>
              <span className="text-muted-foreground text-sm hidden sm:inline">|</span>
              <div className="min-w-0 flex-1">
                <Breadcrumb items={breadcrumbs} className="text-sm truncate" />
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Link
                href="/admin/document-verification"
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Documents
              </Link>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Link
                href="/admin/reviews"
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Reviews
              </Link>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Link
                href="/admin/pricing"
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Pricing
              </Link>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Link
                href="/"
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {children}
      </div>
    </div>
  );
}
