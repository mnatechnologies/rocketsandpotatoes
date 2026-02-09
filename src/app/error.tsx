'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger('ERROR_PAGE')

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 sm:mb-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        <div className="bg-card rounded-lg p-4 sm:p-6 mb-6 border border-border">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            Error Details
          </h2>
          <p className="text-sm text-muted-foreground/70 font-mono break-all">
            {error.message || 'Unknown error occurred'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/50 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="block w-full bg-card hover:bg-muted text-foreground font-semibold py-3 px-6 rounded-lg border border-border transition-colors"
          >
            Return Home
          </Link>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          If this problem persists, please{' '}
          <Link href="/contact" className="text-primary hover:underline">
            contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
