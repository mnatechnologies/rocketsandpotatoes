import {clerkMiddleware, createRouteMatcher} from "@clerk/nextjs/server";
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
  'privacy-policy',
  'terms-conditions',
  'aml-policy',
  'kyc-requirements',
  'security'
]);

// Only allow Australia
const allowedCountries = ['AU'];

export default clerkMiddleware( async (auth, request) => {
  const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks');
  const isBlockedPage = request.nextUrl.pathname.startsWith('/blocked');
  const isClerkService = request.nextUrl.pathname.startsWith('/api/clerk') ||
      request.headers.get('user-agent')?.includes('Clerk') ||
      request.headers.get('referer')?.includes('clerk.com');
  const isStripeService = request.nextUrl.pathname.startsWith('/api/stripe') ||
      request.headers.get('user-agent')?.includes('Stripe') ||
      request.headers.get('authorization')?.startsWith('Bearer sk_');

  if (!isWebhook && !isBlockedPage && !isClerkService && !isStripeService ) {
    // Get country from Vercel's geolocation
    const { country } = geolocation(request);

    // Block if country is not Australia (and country is detected)
    if (country && !allowedCountries.includes(country)) {
      return NextResponse.redirect(new URL('/blocked', request.url));
    }
  }

  // Continue with Clerk authentication
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}