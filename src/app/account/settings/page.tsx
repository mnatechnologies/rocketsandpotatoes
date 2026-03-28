'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, UserProfile } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  source_of_funds: string | null;
  occupation: string | null;
  employer: string | null;
  verification_status: string;
  verification_level: string | null;
  customer_type: string | null;
  created_at: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const verificationLabel: Record<string, string> = {
  unverified: 'Unverified',
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
  enhanced_due_diligence: 'Enhanced Due Diligence',
};

const verificationDescription: Record<string, string> = {
  unverified: 'Your identity has not yet been verified. Some transactions may be limited.',
  pending: 'Your verification documents are under review. We will notify you once complete.',
  verified: 'Your identity has been verified. You have full access to all services.',
  rejected: 'Verification was unsuccessful. Please contact support for assistance.',
  enhanced_due_diligence: 'Your account is subject to enhanced due diligence requirements.',
};

const verificationColor: Record<string, string> = {
  unverified: 'text-yellow-600',
  pending: 'text-blue-600',
  verified: 'text-green-600',
  rejected: 'text-red-600',
  enhanced_due_diligence: 'text-purple-600',
};

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClerkProfile, setShowClerkProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/account/profile', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer || null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in');
      return;
    }
    fetchProfile();
  }, [isLoaded, user, router, fetchProfile]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const verificationStatus = customer?.verification_status || 'unverified';

  return (
    <div className="max-w-2xl">
      {/* Profile Section */}
      <section className="bg-card border border-border rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        </div>
        <div className="px-5 py-5 divide-y divide-border">
          <div className="pb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">First Name</p>
              <p className="text-sm font-medium text-foreground">
                {user.firstName || customer?.first_name || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Name</p>
              <p className="text-sm font-medium text-foreground">
                {user.lastName || customer?.last_name || '-'}
              </p>
            </div>
          </div>
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-1">Email Address</p>
            <p className="text-sm font-medium text-foreground">
              {user.primaryEmailAddress?.emailAddress || customer?.email || '-'}
            </p>
          </div>
          {customer?.occupation && (
            <div className="py-4">
              <p className="text-xs text-muted-foreground mb-1">Occupation</p>
              <p className="text-sm font-medium text-foreground">{customer.occupation}</p>
            </div>
          )}
          {customer?.employer && (
            <div className="py-4">
              <p className="text-xs text-muted-foreground mb-1">Employer</p>
              <p className="text-sm font-medium text-foreground">{customer.employer}</p>
            </div>
          )}
          {customer?.source_of_funds && (
            <div className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Source of Funds</p>
              <p className="text-sm font-medium text-foreground capitalize">{customer.source_of_funds.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Account Status */}
      <section className="bg-card border border-border rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Account Status</h2>
        </div>
        <div className="px-5 py-5 divide-y divide-border">
          <div className="pb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Account Type</p>
              <p className="text-sm font-medium text-foreground capitalize">
                {customer?.customer_type || 'Individual'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Member Since</p>
              <p className="text-sm font-medium text-foreground">
                {customer ? formatDate(customer.created_at) : '-'}
              </p>
            </div>
          </div>
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Verification Status</p>
            <p className={`text-sm font-semibold mb-1 ${verificationColor[verificationStatus] || 'text-foreground'}`}>
              {verificationLabel[verificationStatus] || verificationStatus}
            </p>
            <p className="text-xs text-muted-foreground">
              {verificationDescription[verificationStatus] || ''}
            </p>
          </div>
        </div>
      </section>

      {/* Security / Auth settings */}
      <section className="bg-card border border-border rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your password, two-factor authentication, and connected accounts
          </p>
        </div>
        <div className="px-5 py-5">
          {showClerkProfile ? (
            <div>
              <button
                onClick={() => setShowClerkProfile(false)}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                Hide security settings
              </button>
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none border border-border rounded-lg bg-card',
                    navbar: 'hidden',
                    pageScrollBox: 'p-0',
                  },
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowClerkProfile(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Manage security settings
            </button>
          )}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        To update your name, email, or other profile information, please contact us at{' '}
        <a href="/contact" className="text-primary hover:text-primary/80 transition-colors">
          our support page
        </a>
        .
      </p>
    </div>
  );
}
