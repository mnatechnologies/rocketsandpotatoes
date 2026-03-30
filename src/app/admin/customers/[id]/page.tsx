'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminNote {
  text: string;
  admin_id: string;
  created_at: string;
}

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
  verification_level: string | null;
  monitoring_level: string | null;
  requires_enhanced_dd: boolean;
  is_pep: boolean;
  is_sanctioned: boolean;
  risk_score: number | null;
  risk_level: string | null;
  customer_type: string | null;
  created_at: string;
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
  is_match: boolean;
  match_score: number | null;
  screened_name: string;
  screening_service: string | null;
  status: string;
  screening_type: string | null;
  created_at: string;
}

interface CustomerDetail {
  customer: Customer;
  transactions: Transaction[];
  identity_verifications: IdentityVerification[];
  edd_investigations: EddInvestigation[];
  sanctions_screenings: SanctionsScreening[];
  admin_notes: AdminNote[];
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

interface ScreeningMatch {
  name: string;
  matchScore: number;
  source: string;
}

interface RescreenResult {
  isMatch: boolean;
  matches: ScreeningMatch[];
  screenedAt: string;
  screenedName: string;
}

function AdminActionsPanel({
  customerId,
  customer,
  adminNotes: initialNotes,
  onRefresh,
}: {
  customerId: string;
  customer: Customer;
  adminNotes: AdminNote[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);

  // KYC override state
  const [kycStatus, setKycStatus] = useState(customer.verification_status);
  const [kycReason, setKycReason] = useState('');
  const [kycSaving, setKycSaving] = useState(false);

  // Risk level state
  const [riskLevel, setRiskLevel] = useState(customer.risk_level || 'low');
  const [riskReason, setRiskReason] = useState('');
  const [riskSaving, setRiskSaving] = useState(false);

  // Rescreen state
  const [rescreening, setRescreening] = useState(false);
  const [rescreenResult, setRescreenResult] = useState<RescreenResult | null>(null);

  // Notes state
  const [note, setNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const adminNotes = initialNotes;

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/customers/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Request failed');
    }
    return res.json();
  }

  async function handleKycSave() {
    if (!kycReason.trim()) { toast.error('Reason is required'); return; }
    setKycSaving(true);
    try {
      await patch({ action: 'update_verification', value: kycStatus, reason: kycReason });
      toast.success('KYC status updated');
      setKycReason('');
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setKycSaving(false);
    }
  }

  async function handleRiskSave() {
    if (!riskReason.trim()) { toast.error('Reason is required'); return; }
    setRiskSaving(true);
    try {
      await patch({ action: 'update_risk_level', value: riskLevel, reason: riskReason });
      toast.success('Risk level updated');
      setRiskReason('');
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setRiskSaving(false);
    }
  }

  async function handleRescreen() {
    setRescreening(true);
    setRescreenResult(null);
    try {
      const data = await patch({ action: 'rescreen' });
      setRescreenResult(data.result as RescreenResult);
      toast.success('Re-screen complete');
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Re-screen failed');
    } finally {
      setRescreening(false);
    }
  }

  async function handleNoteSave() {
    if (!note.trim()) { toast.error('Note cannot be empty'); return; }
    setNoteSaving(true);
    try {
      await patch({ action: 'add_note', note });
      toast.success('Note saved');
      setNote('');
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save note');
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-amber-100/60 transition-colors"
      >
        <h2 className="text-base font-semibold text-amber-900">Admin Actions</h2>
        <svg
          className={`w-4 h-4 text-amber-700 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-6">
          {/* KYC Override */}
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Override KYC Status</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <select
                value={kycStatus}
                onChange={(e) => setKycStatus(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-md bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <input
              type="text"
              value={kycReason}
              onChange={(e) => setKycReason(e.target.value)}
              placeholder="Reason (required)"
              className="w-full max-w-md px-3 py-1.5 border border-border rounded-md bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            />
            <button
              onClick={handleKycSave}
              disabled={kycSaving}
              className="px-4 py-1.5 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors"
            >
              {kycSaving ? 'Saving...' : 'Save KYC Status'}
            </button>
          </div>

          <div className="border-t border-amber-200" />

          {/* Risk Level */}
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Change Risk Level</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-md bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <input
              type="text"
              value={riskReason}
              onChange={(e) => setRiskReason(e.target.value)}
              placeholder="Reason (required)"
              className="w-full max-w-md px-3 py-1.5 border border-border rounded-md bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            />
            <button
              onClick={handleRiskSave}
              disabled={riskSaving}
              className="px-4 py-1.5 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors"
            >
              {riskSaving ? 'Saving...' : 'Save Risk Level'}
            </button>
          </div>

          <div className="border-t border-amber-200" />

          {/* Sanctions Re-screen */}
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Sanctions Re-screen</h3>
            <button
              onClick={handleRescreen}
              disabled={rescreening}
              className="px-4 py-1.5 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors"
            >
              {rescreening ? 'Screening...' : 'Run Sanctions Screen'}
            </button>
            {rescreenResult && (
              <div className={`mt-3 p-3 rounded-md text-sm border ${rescreenResult.isMatch ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                <p className="font-medium mb-1">
                  {rescreenResult.isMatch ? `Match found (${rescreenResult.matches.length} result${rescreenResult.matches.length !== 1 ? 's' : ''})` : 'Clear — no matches found'}
                </p>
                {rescreenResult.matches.length > 0 && (
                  <ul className="text-xs space-y-1">
                    {rescreenResult.matches.map((m, i) => (
                      <li key={i}>{m.name} — {m.source} ({Math.round(m.matchScore * 100)}% match)</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-amber-200" />

          {/* Admin Notes */}
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Internal Compliance Notes</h3>
            {adminNotes.length > 0 && (
              <div className="mb-3 space-y-2">
                {adminNotes.map((n, i) => (
                  <div key={i} className="text-sm bg-white border border-amber-200 rounded p-2">
                    <p className="text-foreground whitespace-pre-wrap">{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString('en-AU')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add internal note..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2 resize-y"
            />
            <button
              onClick={handleNoteSave}
              disabled={noteSaving}
              className="px-4 py-1.5 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:opacity-50 transition-colors"
            >
              {noteSaving ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </div>
      )}
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

  const { customer, transactions, identity_verifications, edd_investigations, sanctions_screenings, admin_notes } = data;
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
          <VerificationBadge status={customer.verification_status} />
        </div>
        <p className="text-muted-foreground text-sm">
          {customer.email} &middot; Joined {new Date(customer.created_at).toLocaleDateString('en-AU')}
          {totalSpent > 0 && ` · ${formatAUD(totalSpent)} total spent`}
        </p>
      </div>

      <div className="space-y-4">
        {/* Admin Actions */}
        <AdminActionsPanel customerId={id} customer={customer} adminNotes={admin_notes} onRefresh={fetchCustomer} />

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
            <InfoRow
              label="PEP Status"
              value={
                customer.is_pep
                  ? <span className="text-red-600 font-medium">PEP Identified</span>
                  : 'Not a PEP'
              }
            />
            <InfoRow
              label="Sanctions Status"
              value={
                customer.is_sanctioned
                  ? <span className="text-red-600 font-medium">Sanctioned</span>
                  : 'Clear'
              }
            />
            <InfoRow
              label="Risk Score"
              value={customer.risk_score !== null ? `${customer.risk_score}/100 (${customer.risk_level || 'low'})` : 'Not assessed'}
            />
            {latestScreening && (
              <>
                <InfoRow
                  label="Last Screening"
                  value={`${latestScreening.screening_service || 'Unknown'} — ${latestScreening.is_match ? 'Match found' : 'Clear'} (${latestScreening.status})`}
                />
                {latestScreening.match_score !== null && (
                  <InfoRow label="Match Score" value={`${latestScreening.match_score}%`} />
                )}
                <InfoRow
                  label="Screened At"
                  value={new Date(latestScreening.created_at).toLocaleDateString('en-AU')}
                />
              </>
            )}
            {!latestScreening && (
              <InfoRow label="Sanctions Screening" value={<span className="text-muted-foreground italic">Not screened yet</span>} />
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
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Service</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Match</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Score</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanctions_screenings.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          {new Date(s.created_at).toLocaleDateString('en-AU')}
                        </td>
                        <td className="px-3 py-2 text-xs">{s.screening_service || '—'}</td>
                        <td className="px-3 py-2">{s.is_match ? 'Yes' : 'No'}</td>
                        <td className="px-3 py-2">{s.match_score ?? '—'}</td>
                        <td className="px-3 py-2 text-xs capitalize">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </SectionCard>

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
