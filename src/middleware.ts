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
  '/blocked(.*)'  // Allow access to the blocked page
]);

// Only allow Australia
const allowedCountries = ['AU'];

export default clerkMiddleware( async (auth, request) => {
  // Skip geo-blocking for webhook endpoints and the blocked page
  const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks');
  const isBlockedPage = request.nextUrl.pathname.startsWith('/blocked');

  if (!isWebhook && !isBlockedPage) {
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