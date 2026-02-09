'use client';

import { useEffect } from 'react';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger('GLOBAL_ERROR')
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body style={{ backgroundColor: 'hsl(220 16% 6%)', color: 'hsl(40 6% 90%)', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem' }}>
          <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>💥</div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'hsl(40 6% 90%)', marginBottom: '0.5rem' }}>
                Critical Error
              </h1>
              <p style={{ fontSize: '1rem', color: 'hsl(215 8% 58%)', marginBottom: '1.5rem' }}>
                A critical error occurred. Please refresh the page.
              </p>
            </div>

            <div style={{ backgroundColor: 'hsl(220 14% 9%)', borderRadius: '0.625rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid hsl(220 12% 18%)' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'hsl(215 8% 58%)', marginBottom: '0.5rem', marginTop: 0 }}>
                Error Details
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'hsl(215 8% 48%)', fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>
                {error.message || 'Unknown error occurred'}
              </p>
              {error.digest && (
                <p style={{ fontSize: '0.75rem', color: 'hsl(215 8% 38%)', marginTop: '0.5rem', marginBottom: 0 }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  backgroundColor: 'hsl(43 75% 56%)',
                  color: 'hsl(220 16% 8%)',
                  fontWeight: '600',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.625rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'hsl(40 6% 90%)',
                  fontWeight: '600',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.625rem',
                  border: '2px solid hsl(43 75% 56%)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
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
