'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface Customer {
  id: string;
  clerk_user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  source_of_funds: string | null;
  occupation: string | null;
  employer: string | null;
  verification_status: string;
  monitoring_level: string | null;
  requires_enhanced_dd: boolean;
  created_at: string;
}

interface BeneficialOwner {
  id: string;
  full_name: string;
  ownership_percentage: number;
  is_pep: boolean;
  screening_status: string;
}

interface BusinessCustomer {
  id: string;
  abn: string | null;
  acn: string | null;
  entity_type: string | null;
  business_name: string | null;
  trading_name: string | null;
  verification_status: string;
  created_at: string;
  beneficial_owners: BeneficialOwner[];
}

interface Transaction {
  id: string;
  amount: number;
  amount_aud: number;
  currency: string;
  payment_status: string;
  payment_method_type: string | null;
  product_details: {
    items?: Array<{ product?: { name?: string }; name?: string; quantity?: number }>;
  } | null;
  fulfillment_status: string | null;
  created_at: string;
}

interface IdentityVerification {
  id: string;
  verification_type: string;
  status: string;
  created_at: string;
}

interface EddInvestigation {
  id: string;
  status: string;
  created_at: string;
}

interface SanctionsScreening {
  id: string;
  is_pep: boolean;
  is_sanctioned: boolean;
  match_score: number | null;
  created_at: string;
}

interface CustomerDetail {
  customer: Customer;
  business: BusinessCustomer | null;
  transactions: Transaction[];
  identity_verifications: IdentityVerification[];
  edd_investigations: EddInvestigation[];
  sanctions_screenings: SanctionsScreening[];
}

function VerificationBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: 'bg-green-100 text-green-800 border border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    unverified: 'bg-gray-100 text-gray-600 border border-gray-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200',
  };
  const labels: Record<string, string> = {
    verified: 'Verified',
    pending: 'Pending',
    unverified: 'Unverified',
    rejected: 'Rejected',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}

function StatusBadge({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2 border-b border-border/50 last:border-0">
      <dt className="w-40 flex-shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not provided</span>}</dd>
    </div>
  );
}

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Customer not found.{' '}
        <Link href="/admin/customers" className="text-primary hover:underline">
          Back to Customers
        </Link>
      </div>
    );
  }

  const { customer, business, transactions, identity_verifications, edd_investigations, sanctions_screenings } = data;
  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email;
  const latestScreening = sanctions_screenings[0] || null;
  const latestEdd = edd_investigations[0] || null;
  const totalSpent = transactions
    .filter((t) => t.payment_status === 'succeeded')
    .reduce((sum, t) => sum + (t.amount_aud || 0), 0);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Customers
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-foreground">{fullName}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
            business
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}>
            {business ? 'Business Account' : 'Individual'}
          </span>
          <VerificationBadge status={customer.verification_status} />
        </div>
        <p className="text-muted-foreground text-sm">
          {customer.email} &middot; Joined {new Date(customer.created_at).toLocaleDateString('en-AU')}
          {totalSpent > 0 && ` · ${formatAUD(totalSpent)} total spent`}
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <SectionCard title="Profile">
          <dl>
            <InfoRow label="First Name" value={customer.first_name} />
            <InfoRow label="Last Name" value={customer.last_name} />
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Occupation" value={customer.occupation} />
            <InfoRow label="Employer" value={customer.employer} />
            <InfoRow label="Source of Funds" value={customer.source_of_funds} />
            <InfoRow label="Clerk User ID" value={
              customer.clerk_user_id
                ? <span className="font-mono text-xs">{customer.clerk_user_id}</span>
                : null
            } />
          </dl>
        </SectionCard>

        {/* Verification */}
        <SectionCard title="Verification">
          <div className="mb-4">
            <InfoRow label="KYC Status" value={<VerificationBadge status={customer.verification_status} />} />
          </div>
          {identity_verifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No identity verifications on record.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {identity_verifications.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 capitalize">{v.verification_type?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          status={v.status}
                          colorMap={{
                            verified: 'bg-green-100 text-green-800',
                            pending: 'bg-yellow-100 text-yellow-800',
                            failed: 'bg-red-100 text-red-800',
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString('en-AU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Risk & Compliance */}
        <SectionCard title="Risk & Compliance">
          <dl className="mb-4">
            <InfoRow
              label="Monitoring Level"
              value={
                customer.monitoring_level
                  ? <span className="capitalize">{customer.monitoring_level}</span>
                  : 'Standard'
              }
            />
            <InfoRow
              label="Enhanced DD Required"
              value={
                customer.requires_enhanced_dd
                  ? <span className="text-red-600 font-medium">Yes</span>
                  : 'No'
              }
            />
            {latestScreening && (
              <>
                <InfoRow
                  label="PEP Status"
                  value={
                    latestScreening.is_pep
                      ? <span className="text-red-600 font-medium">PEP Identified</span>
                      : 'No match'
                  }
                />
                <InfoRow
                  label="Sanctions"
                  value={
                    latestScreening.is_sanctioned
                      ? <span className="text-red-600 font-medium">Sanctioned</span>
                      : 'Clear'
                  }
                />
                {latestScreening.match_score !== null && (
                  <InfoRow label="Match Score" value={`${latestScreening.match_score}%`} />
                )}
                <InfoRow
                  label="Last Screened"
                  value={new Date(latestScreening.created_at).toLocaleDateString('en-AU')}
                />
              </>
            )}
            {!latestScreening && (
              <InfoRow label="Sanctions Screening" value={<span className="text-muted-foreground italic">Not screened</span>} />
            )}
            <InfoRow
              label="EDD Status"
              value={
                latestEdd
                  ? <StatusBadge
                      status={latestEdd.status}
                      colorMap={{
                        open: 'bg-red-100 text-red-800',
                        in_progress: 'bg-yellow-100 text-yellow-800',
                        closed: 'bg-green-100 text-green-800',
                      }}
                    />
                  : <span className="text-muted-foreground italic">None</span>
              }
            />
          </dl>

          {sanctions_screenings.length > 1 && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Show all screenings ({sanctions_screenings.length})
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">PEP</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Sanctioned</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanctions_screenings.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          {new Date(s.created_at).toLocaleDateString('en-AU')}
                        </td>
                        <td className="px-3 py-2">{s.is_pep ? 'Yes' : 'No'}</td>
                        <td className="px-3 py-2">{s.is_sanctioned ? 'Yes' : 'No'}</td>
                        <td className="px-3 py-2">{s.match_score ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </SectionCard>

        {/* Business section — only shown for business accounts */}
        {business && (
          <SectionCard title="Business Details">
            <dl className="mb-4">
              <InfoRow label="Business Name" value={business.business_name} />
              <InfoRow label="Trading Name" value={business.trading_name} />
              <InfoRow label="Entity Type" value={business.entity_type} />
              <InfoRow label="ABN" value={business.abn ? <span className="font-mono">{business.abn}</span> : null} />
              <InfoRow label="ACN" value={business.acn ? <span className="font-mono">{business.acn}</span> : null} />
              <InfoRow label="Verification" value={<VerificationBadge status={business.verification_status} />} />
            </dl>

            {business.beneficial_owners.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-foreground mb-2">Beneficial Owners</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ownership</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">PEP</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Screening</th>
                      </tr>
                    </thead>
                    <tbody>
                      {business.beneficial_owners.map((bo) => (
                        <tr key={bo.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium">{bo.full_name}</td>
                          <td className="px-3 py-2">{bo.ownership_percentage}%</td>
                          <td className="px-3 py-2">
                            {bo.is_pep
                              ? <span className="text-red-600 font-medium text-xs">PEP</span>
                              : <span className="text-muted-foreground text-xs">No</span>
                            }
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge
                              status={bo.screening_status || 'not_screened'}
                              colorMap={{
                                clear: 'bg-green-100 text-green-800',
                                matched: 'bg-red-100 text-red-800',
                                pending: 'bg-yellow-100 text-yellow-800',
                                not_screened: 'bg-gray-100 text-gray-600',
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SectionCard>
        )}

        {/* Orders */}
        <SectionCard title={`Orders (${transactions.length})`}>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders on record.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Amount (AUD)</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Payment Method</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Payment Status</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Fulfillment</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const items = t.product_details?.items || [];
                    const itemSummary = items.length
                      ? items
                          .map((i) => `${i.product?.name || i.name || 'Item'} x${i.quantity || 1}`)
                          .join(', ')
                      : '—';
                    return (
                      <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString('en-AU')}
                        </td>
                        <td className="px-3 py-2 font-medium">{formatAUD(t.amount_aud)}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            t.payment_method_type === 'bank_transfer'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {t.payment_method_type === 'bank_transfer' ? 'Bank Transfer' : 'Card'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge
                            status={t.payment_status}
                            colorMap={{
                              succeeded: 'bg-green-100 text-green-800',
                              pending: 'bg-yellow-100 text-yellow-800',
                              failed: 'bg-red-100 text-red-800',
                              refunded: 'bg-gray-100 text-gray-600',
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          {t.fulfillment_status ? (
                            <StatusBadge
                              status={t.fulfillment_status}
                              colorMap={{
                                unfulfilled: 'bg-red-100 text-red-800',
                                packing: 'bg-yellow-100 text-yellow-800',
                                ready_for_pickup: 'bg-blue-100 text-blue-800',
                                collected: 'bg-green-100 text-green-800',
                              }}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px] truncate" title={itemSummary}>
                          {itemSummary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
