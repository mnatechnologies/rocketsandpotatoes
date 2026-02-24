'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {
      // silently fail if storage is unavailable
    }
    setVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'essential-only');
    } catch {
      // silently fail if storage is unavailable
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We use essential cookies for authentication and security, plus optional cookies to remember your preferences.
            Learn more in our{' '}
            <Link
              href="/cookie-policy"
              className="text-primary hover:underline font-medium"
            >
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy-policy"
              className="text-primary hover:underline font-medium"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-3">
            <button
              onClick={handleDecline}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              Essential Only
            </button>
            <button
              onClick={handleAccept}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
