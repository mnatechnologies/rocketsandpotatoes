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
          <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            We encountered an unexpected error. Don&apos;t worry, we&apos;re working on it.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Error Details
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-500 font-mono break-all">
            {error.message || 'Unknown error occurred'}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="block w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-foreground font-semibold py-3 px-6 rounded-lg border-2 border-primary transition-colors"
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
