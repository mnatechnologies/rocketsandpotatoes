'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 sm:mb-8">
              <div className="text-5xl sm:text-6xl mb-4">💥</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Critical Error
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                A critical error occurred. Please refresh the page.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 border border-gray-200 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-600 mb-2">
                Error Details
              </h2>
              <p className="text-sm text-gray-500 font-mono break-all">
                {error.message || 'Unknown error occurred'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-400 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-lg border-2 border-yellow-500 transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
