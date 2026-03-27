'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  weight?: number;
  purity?: string;
}

interface Transaction {
  id: string;
  customer_id: string;
  transaction_type: string;
  amount: number;
  amount_aud: number;
  currency: string;
  fx_rate: number | null;
  payment_method_type: string | null;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  items: OrderItem[];
  requires_kyc: boolean;
  requires_ttr: boolean;
  requires_enhanced_dd: boolean;
  flagged_for_review: boolean;
  review_status: string | null;
  review_notes: string | null;
  fulfillment_status: string | null;
  ready_at: string | null;
  collected_at: string | null;
  fulfillment_notes: string | null;
  payment_cardholder_name: string | null;
  payment_name_mismatch: boolean;
  payment_name_mismatch_severity: string | null;
  created_at: string;
}

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  verification_status: string;
}

interface BankTransfer {
  id: string;
  transaction_id: string;
  reference_code: string;
  status: string;
  hold_status: string | null;
  hold_captured_amount: number | null;
  deposit_percentage: number | null;
  deposit_amount_aud: number | null;
  payment_deadline: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  confirmation_notes: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface OrderDetail {
  transaction: Transaction;
  customer: Customer | null;
  bank_transfer: BankTransfer | null;
  audit_logs: AuditLog[];
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    succeeded: 'bg-green-100 text-green-800 border border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    failed: 'bg-red-100 text-red-800 border border-red-200',
    awaiting_bank_transfer: 'bg-blue-100 text-blue-800 border border-blue-200',
  };
  const labels: Record<string, string> = {
    succeeded: 'Succeeded',
    pending: 'Pending',
    failed: 'Failed',
    awaiting_bank_transfer: 'Awaiting Transfer',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  );
}

function FulfillmentStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const styles: Record<string, string> = {
    unfulfilled: 'bg-gray-100 text-gray-600 border border-gray-200',
    packing: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    ready_for_pickup: 'bg-blue-100 text-blue-800 border border-blue-200',
    collected: 'bg-green-100 text-green-800 border border-green-200',
  };
  const labels: Record<string, string> = {
    unfulfilled: 'Unfulfilled',
    packing: 'Packing',
    ready_for_pickup: 'Ready for Pickup',
    collected: 'Collected',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  );
}

function MismatchSeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return null;
  const styles: Record<string, string> = {
    low: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    medium: 'bg-orange-100 text-orange-800 border border-orange-200',
    high: 'bg-red-100 text-red-800 border border-red-200',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[severity] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)} mismatch
    </span>
  );
}

function ComplianceBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-orange-100 text-orange-800 border-orange-200">
      {label}
    </span>
  );
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDateTime(dt: string): string {
  return new Date(dt).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-40">{label}</span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.status === 404) {
        toast.error('Order not found');
        setData(null);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        Order not found.{' '}
        <Link href="/admin/orders" className="text-primary hover:underline">Back to orders</Link>
      </div>
    );
  }

  const { transaction: tx, customer, bank_transfer: bt, audit_logs } = data;

  return (
    <div>
      {/* Back link */}
      <div className="mb-4">
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Orders
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-foreground">
            Order <span className="font-mono text-2xl">{tx.id.slice(0, 8)}…</span>
          </h1>
          <PaymentStatusBadge status={tx.payment_status} />
          <FulfillmentStatusBadge status={tx.fulfillment_status} />
        </div>
        <p className="text-muted-foreground text-sm">{formatDateTime(tx.created_at)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Customer */}
        <Card title="Customer">
          {customer ? (
            <>
              <Row label="Name">
                {customer.first_name || customer.last_name
                  ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                  : <span className="italic text-muted-foreground">No name</span>
                }
              </Row>
              <Row label="Email">{customer.email}</Row>
              <Row label="Verification">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                  customer.verification_status === 'verified'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : customer.verification_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {customer.verification_status}
                </span>
              </Row>
              <Row label="Profile">
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="text-primary hover:underline text-sm"
                >
                  View Customer
                </Link>
              </Row>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Customer data unavailable.</p>
          )}
        </Card>

        {/* Payment */}
        <Card title="Payment">
          <Row label="Method">
            {tx.payment_method_type === 'card' ? 'Card' : tx.payment_method_type === 'bank_transfer' ? 'Bank Transfer' : tx.payment_method_type || '—'}
          </Row>
          <Row label="Status"><PaymentStatusBadge status={tx.payment_status} /></Row>
          {tx.stripe_payment_intent_id && (
            <Row label="Stripe Intent">
              <span className="font-mono text-xs">
                {tx.stripe_payment_intent_id.slice(0, 18)}…
                <CopyButton value={tx.stripe_payment_intent_id} />
              </span>
            </Row>
          )}
          {tx.payment_cardholder_name && (
            <Row label="Cardholder">{tx.payment_cardholder_name}</Row>
          )}
          {tx.payment_name_mismatch && (
            <Row label="Name Mismatch">
              <MismatchSeverityBadge severity={tx.payment_name_mismatch_severity} />
            </Row>
          )}
        </Card>

        {/* Items */}
        <div className="lg:col-span-2">
          <Card title="Items">
            {tx.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qty</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit Price AUD</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.items.map((item, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-foreground">
                          {item.name}
                          {(item.weight || item.purity) && (
                            <div className="text-xs text-muted-foreground">
                              {[item.weight && `${item.weight}oz`, item.purity].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.quantity}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.price ? formatAUD(item.price) : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.price ? formatAUD(item.price * item.quantity) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Amounts */}
        <Card title="Amounts">
          <Row label="Total USD">{tx.amount ? formatUSD(tx.amount) : '—'}</Row>
          <Row label="Total AUD">{tx.amount_aud ? formatAUD(tx.amount_aud) : '—'}</Row>
          {tx.fx_rate && (
            <Row label="FX Rate">
              <span className="font-mono text-xs">1 USD = {tx.fx_rate.toFixed(4)} AUD</span>
            </Row>
          )}
        </Card>

        {/* Bank Transfer */}
        {bt && (
          <Card title="Bank Transfer">
            <Row label="Reference">{bt.reference_code}</Row>
            <Row label="Status">{bt.status}</Row>
            {bt.hold_status && <Row label="Hold Status">{bt.hold_status}</Row>}
            {bt.deposit_percentage != null && (
              <Row label="Hold Deposit">{bt.deposit_percentage}%</Row>
            )}
            {bt.deposit_amount_aud != null && (
              <Row label="Deposit Amount">{formatAUD(bt.deposit_amount_aud)}</Row>
            )}
            {bt.hold_captured_amount != null && (
              <Row label="Captured Amount">{formatAUD(bt.hold_captured_amount)}</Row>
            )}
            {bt.payment_deadline && (
              <Row label="Payment Deadline">{formatDateTime(bt.payment_deadline)}</Row>
            )}
            {bt.confirmed_at && (
              <Row label="Confirmed At">{formatDateTime(bt.confirmed_at)}</Row>
            )}
            {bt.confirmed_by && <Row label="Confirmed By">{bt.confirmed_by}</Row>}
            {bt.confirmation_notes && <Row label="Notes">{bt.confirmation_notes}</Row>}
          </Card>
        )}

        {/* Compliance */}
        <Card title="Compliance">
          <div className="flex flex-wrap gap-2 mb-3">
            <ComplianceBadge label="KYC Required" active={tx.requires_kyc} />
            <ComplianceBadge label="TTR Required" active={tx.requires_ttr} />
            <ComplianceBadge label="Enhanced DD" active={tx.requires_enhanced_dd} />
            {tx.flagged_for_review && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-200">
                Flagged for Review
              </span>
            )}
            {!tx.requires_kyc && !tx.requires_ttr && !tx.requires_enhanced_dd && !tx.flagged_for_review && (
              <span className="text-sm text-muted-foreground">No compliance flags</span>
            )}
          </div>
          {tx.review_status && <Row label="Review Status">{tx.review_status}</Row>}
          {tx.review_notes && (
            <Row label="Review Notes">
              <span className="whitespace-pre-wrap text-left">{tx.review_notes}</span>
            </Row>
          )}
        </Card>

        {/* Fulfillment */}
        <Card title="Fulfillment">
          <Row label="Status"><FulfillmentStatusBadge status={tx.fulfillment_status} /></Row>
          {tx.ready_at && <Row label="Ready At">{formatDateTime(tx.ready_at)}</Row>}
          {tx.collected_at && <Row label="Collected At">{formatDateTime(tx.collected_at)}</Row>}
          {tx.fulfillment_notes && <Row label="Notes">{tx.fulfillment_notes}</Row>}
        </Card>

        {/* Audit Logs */}
        {audit_logs.length > 0 && (
          <div className="lg:col-span-2">
            <Card title="Audit Log">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit_logs.map((log) => (
                      <tr key={log.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{log.action}</td>
                        <td className="px-4 py-3 text-muted-foreground">{log.entity_type}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
