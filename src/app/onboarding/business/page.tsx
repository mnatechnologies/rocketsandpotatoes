'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ABNLookup } from '@/components/Business-Registration/ABNLookup';
import { UBOForm } from '@/components/Business-Registration/UBOForm';
import { ABRResponse, EntityType, BeneficialOwner } from '@/types/business';
import { Check, Building2, Users, Shield } from 'lucide-react';

type Step = 'entity-type' | 'abn-verify' | 'add-owners' | 'verify-owners' | 'complete';

const ENTITY_TYPES: { value: EntityType; label: string; description: string }[] = [
  { value: 'company', label: 'Company (Pty Ltd / Ltd)', description: 'Private or public company with ACN' },
  { value: 'sole_trader', label: 'Sole Trader', description: 'Individual operating under ABN' },
  { value: 'partnership', label: 'Partnership', description: 'Two or more partners' },
  { value: 'trust', label: 'Trust', description: 'Family, unit, or discretionary trust' },
  { value: 'smsf', label: 'Self-Managed Super Fund', description: 'SMSF with individual trustees' },
];

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const { isLoaded } = useUser();

  const [step, setStep] = useState<Step>('entity-type');
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [abrData, setAbrData] = useState<ABRResponse | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [owners, setOwners] = useState<BeneficialOwner[]>([]);
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate total ownership
  const totalOwnership = owners.reduce((sum, o) => sum + o.ownership_percentage, 0);
  const canAddMoreOwners = totalOwnership < 100;
  const allOwnersVerified = owners.length > 0 && owners.every(o => o.verification_status === 'verified');

  // Check for existing business on mount
  useEffect(() => {
    const checkExistingBusiness = async () => {
      try {
        const response = await fetch('/api/business/current');
        if (response.ok) {
          const data = await response.json();

          if (data.business) {
            // Resume from existing business
            setBusinessId(data.business.id);
            setEntityType(data.business.entity_type);
            setAbrData({
              abn: data.business.abn,
              acn: data.business.acn,
              entityName: data.business.business_name,
              entityType: data.business.entity_type,
              entityTypeCode: '',
              abnStatus: 'Active',
              abnStatusFromDate: '',
              gstRegistered: false,
              mainBusinessLocation: {
                state: data.business.registered_address?.state || '',
                postcode: data.business.registered_address?.postcode || '',
              },
            });

            // Load owners
            const ownersResponse = await fetch(`/api/business/${data.business.id}/owners`);
            if (ownersResponse.ok) {
              const ownersData = await ownersResponse.json();
              setOwners(ownersData.owners);

              // Determine which step to resume
              if (ownersData.owners.length === 0) {
                setStep('add-owners');
              } else {
                setStep('verify-owners');
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to check existing business:', err);
      }
    };

    if (isLoaded) {
      checkExistingBusiness();
    }
  }, [isLoaded]);

  // Step 1: Select Entity Type
  const handleEntityTypeSelect = (type: EntityType) => {
    setEntityType(type);
    setStep('abn-verify');
  };

  // Step 2: ABN Verified
  const handleABNVerified = async (data: ABRResponse) => {
    setAbrData(data);
    setLoading(true);
    setError(null);

    try {
      // Register the business
      const response = await fetch('/api/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          abn: data.abn,
          acn: data.acn,
          business_name: data.entityName,
          abr_response: data,
          registered_address: {
            state: data.mainBusinessLocation.state,
            postcode: data.mainBusinessLocation.postcode,
            country: 'Australia',
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register business');
      }

      setBusinessId(result.business_id);
      setStep('add-owners');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register business');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Owner Added
  const handleOwnerAdded = async () => {
    setShowAddOwner(false);
    await refreshOwners();
  };

  const refreshOwners = async () => {
    if (!businessId) return;

    const response = await fetch(`/api/business/${businessId}/owners`);
    if (response.ok) {
      const data = await response.json();
      setOwners(data.owners);
    }
  };

  // Step 4: Initiate owner verification
  const initiateOwnerVerification = async (ownerId: string, verificationMethod: 'stripe_identity' | 'manual') => {
    try {
      const response = await fetch(`/api/business/${businessId}/owners/${ownerId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_method: verificationMethod }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.url) {
          // Redirect to Stripe Identity verification
          window.location.href = result.url;
        } else if (result.redirect) {
          // Redirect to manual document upload
          router.push(result.redirect);
        }
      }
    } catch (err) {
      console.error('Failed to initiate verification:', err);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    setLoading(true);

    try {
      // Mark onboarding as complete
      await fetch('/api/customer/account-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete_onboarding: true }),
      });

      router.push('/');
    } catch (err) {
      setError('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'entity-type', label: 'Business Type', icon: Building2 },
              { key: 'abn-verify', label: 'Verify ABN', icon: Shield },
              { key: 'add-owners', label: 'Add Owners', icon: Users },
              { key: 'verify-owners', label: 'Verify IDs', icon: Check },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${step === s.key ? 'bg-primary text-primary-foreground' :
                  ['entity-type'].indexOf(step) < ['entity-type', 'abn-verify', 'add-owners', 'verify-owners'].indexOf(s.key)
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-green-500 text-white'}
                `}>
                  <s.icon className="w-5 h-5" />
                </div>
                {i < 3 && <div className="w-16 h-1 bg-muted mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive-foreground">
            {error}
          </div>
        )}

        {/* Step 1: Entity Type Selection */}
        {step === 'entity-type' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">What type of business?</h2>
            <div className="space-y-3">
              {ENTITY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleEntityTypeSelect(type.value)}
                  className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary text-left transition-colors"
                >
                  <div className="font-semibold">{type.label}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: ABN Verification */}
        {step === 'abn-verify' && entityType && (
          <div>
            <button
              onClick={() => setStep('entity-type')}
              className="mb-4 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to business type
            </button>
            <ABNLookup
              entityType={entityType}
              onVerified={handleABNVerified}
            />
            {loading && <p className="mt-4 text-center">Registering business...</p>}
          </div>
        )}

        {/* Step 3: Add Beneficial Owners */}
        {step === 'add-owners' && businessId && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Beneficial Owners</h2>
            <p className="text-muted-foreground mb-6">
              Add all individuals who own 25% or more of the business.
              Each owner will need to verify their identity.
            </p>

            {/* List of owners */}
            {owners.length > 0 && (
              <div className="mb-6 space-y-3">
                {owners.map((owner) => (
                  <div key={owner.id} className="p-4 bg-card border rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-medium">{owner.first_name} {owner.last_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {owner.ownership_percentage}% • {owner.role || owner.ownership_type}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      owner.verification_status === 'verified' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                        owner.verification_status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                          'bg-muted text-muted-foreground'
                    }`}>
                      {owner.verification_status}
                    </div>
                  </div>
                ))}
                <div className="text-sm text-muted-foreground">
                  Total ownership: {totalOwnership}%
                </div>
              </div>
            )}

            {/* Add owner form */}
            {showAddOwner ? (
              <UBOForm
                businessId={businessId}
                currentTotalOwnership={totalOwnership}
                onAdded={handleOwnerAdded}
                onCancel={() => setShowAddOwner(false)}
              />
            ) : (
              <div className="space-y-4">
                {canAddMoreOwners && (
                  <button
                    onClick={() => setShowAddOwner(true)}
                    className="w-full p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + Add Beneficial Owner
                  </button>
                )}

                {owners.length > 0 && (
                  <button
                    onClick={() => setStep('verify-owners')}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold"
                  >
                    Continue to Verification
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Verify Owners */}
        {step === 'verify-owners' && businessId && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Verify Owner Identities</h2>
            <p className="text-muted-foreground mb-6">
              Each beneficial owner must complete identity verification before you can start purchasing.
            </p>

            <div className="space-y-4">
              {owners.map((owner) => (
                <div key={owner.id} className="p-4 bg-card border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="font-medium">{owner.first_name} {owner.last_name}</div>
                      <div className="text-sm text-muted-foreground">{owner.ownership_percentage}%</div>
                    </div>

                    {owner.verification_status === 'verified' && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Check className="w-5 h-5" />
                        Verified
                      </div>
                    )}
                    {owner.verification_status === 'pending' && (
                      <div className="text-yellow-600 dark:text-yellow-400">
                        {owner.verification_level === 'stripe_identity'
                          ? 'Stripe verification in progress'
                          : 'Documents under review'}
                      </div>
                    )}
                  </div>

                  {owner.verification_status === 'unverified' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => initiateOwnerVerification(owner.id, 'stripe_identity')}
                        className="p-3 border rounded-lg hover:border-primary text-left transition-colors"
                      >
                        <div className="font-medium text-sm">Quick Verify</div>
                        <div className="text-xs text-muted-foreground">
                          Scan passport or license with selfie (~2 min)
                        </div>
                      </button>
                      <button
                        onClick={() => initiateOwnerVerification(owner.id, 'manual')}
                        className="p-3 border rounded-lg hover:border-primary text-left transition-colors"
                      >
                        <div className="font-medium text-sm">Upload Documents</div>
                        <div className="text-xs text-muted-foreground">
                          Submit certified ID documents for manual review
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {allOwnersVerified && (
              <div className="mt-8">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                  <div className="font-semibold text-green-600 dark:text-green-400">All owners verified!</div>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    Your business account is ready. You can now start purchasing.
                  </p>
                </div>
                <button
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold"
                >
                  {loading ? 'Completing...' : 'Start Shopping'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}