'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Building2, User } from 'lucide-react';

export default function AccountTypePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if user already completed onboarding
  useEffect(() => {
    if (!isLoaded) return;

    const checkOnboardingStatus = async () => {
      try {
        const res = await fetch('/api/customer');
        if (res.ok) {
          const customer = await res.json();

          // If onboarding complete, redirect based on customer type
          if (customer.onboarding_complete) {
            if (customer.customer_type === 'business_contact' && customer.business_customer_id) {
              // Check if business verification is complete
              const bizRes = await fetch(`/api/business/${customer.business_customer_id}`);
              if (bizRes.ok) {
                const business = await bizRes.json();
                if (!business.ubo_verification_complete) {
                  router.push('/onboarding/business/verify');
                  return;
                }
              }
            }
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkOnboardingStatus();
  }, [isLoaded, router]);

  const selectAccountType = async (type: 'individual' | 'business') => {
    setLoading(true);

    try {
      const response = await fetch('/api/customer/account-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: type }),
      });

      if (!response.ok) {
        throw new Error('Failed to set account type');
      }

      if (type === 'business') {
        router.push('/onboarding/business');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error setting account type:', error);
      setLoading(false);
    }
  };

  if (!isLoaded || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Australian National Bullion
          </h1>
          <p className="text-muted-foreground">
            How will you be making purchases?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Account */}
          <button
            onClick={() => selectAccountType('individual')}
            disabled={loading}
            className="group p-8 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all text-left disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Personal Account
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Purchase precious metals for yourself or as gifts.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Start buying immediately</li>
              <li>• ID verification at $5,000 AUD</li>
              <li>• Standard compliance checks</li>
            </ul>
          </button>

          {/* Business Account */}
          <button
            onClick={() => selectAccountType('business')}
            disabled={loading}
            className="group p-8 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all text-left disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Business Account
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Purchase on behalf of a company, trust, or SMSF.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• ABN verification required</li>
              <li>• Beneficial owner identification</li>
              <li>• ID verification before first purchase</li>
            </ul>
          </button>
        </div>

        {loading && (
          <div className="mt-6 text-center text-muted-foreground">
            Setting up your account...
          </div>
        )}
      </div>
    </div>
  );
}