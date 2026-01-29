import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/products(.*)',
  '/api/metals(.*)',
  '/api/products(.*)',
  '/api/checkout(.*)',
  '/api/create-payment-intent',
  '/kyc-return',
  '/api/kyc/webhook',
  '/api/fx-rate',
  '/blocked(.*)',
  '/about',
  '/contact',
  '/faq',
  '/pickup-information',
  '/returns-refunds',
  '/privacy-policy',
  '/terms-conditions',
  '/aml-policy',
  '/kyc-requirements',
  '/security',
  '/charts',
  '/api/charts(.*)'
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

const allowedCountries = ['AU'];

export default clerkMiddleware(async (auth, request) => {
  const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks');
  const isBlockedPage = request.nextUrl.pathname.startsWith('/blocked');
  const isClerkService = request.nextUrl.pathname.startsWith('/api/clerk') ||
    request.headers.get('user-agent')?.includes('Clerk') ||
    request.headers.get('referer')?.includes('clerk.com');
  const isStripeService = request.nextUrl.pathname.startsWith('/api/stripe') ||
    request.headers.get('user-agent')?.includes('Stripe');

  // Geo-blocking
  if (!isWebhook && !isBlockedPage && !isClerkService && !isStripeService) {
    const { country } = geolocation(request);
    if (country && !allowedCountries.includes(country)) {
      return NextResponse.redirect(new URL('/blocked', request.url));
    }
  }

  // Get auth status
  const { userId } = await auth();

  // For authenticated users, check onboarding status
  if (userId && !isPublicRoute(request) && !isOnboardingRoute(request) && !isApiRoute(request)) {
    // Check onboarding via API call (or use Clerk session claims)
    // For now, let individual pages handle their own checks
    // A more robust solution would use Clerk's publicMetadata
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};