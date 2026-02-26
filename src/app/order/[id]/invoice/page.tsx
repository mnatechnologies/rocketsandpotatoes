'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
  Info,
  Building2,
} from 'lucide-react';
import type { BankTransferStatus } from '@/types/bank-transfer';

// --- Types for the status API response ---

interface AwaitingTransferResponse {
  status: 'awaiting_transfer';
  referenceCode: string;
  paymentDeadline: string;
  timeRemainingSeconds: number;
  bankName: string;
  bsb: string;
  accountNumber: string;
  accountName: string;
  payidIdentifier: string | null;
  payidType: string | null;
  amountAud: number;
  depositAmountAud: number;
}

interface SucceededResponse {
  status: 'succeeded';
  referenceCode: string;
}

interface ExpiredCancelledResponse {
  status: 'expired' | 'cancelled';
  referenceCode: string;
}

interface HoldPendingResponse {
  status: 'hold_pending';
}

type StatusResponse =
  | AwaitingTransferResponse
  | SucceededResponse
  | ExpiredCancelledResponse
  | HoldPendingResponse;

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getProgressColor(remainingSeconds: number, totalSeconds: number): string {
  const hoursRemaining = remainingSeconds / 3600;
  if (hoursRemaining < 2) return 'bg-red-500';
  if (hoursRemaining < 6) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getProgressBarColor(remainingSeconds: number): string {
  const hoursRemaining = remainingSeconds / 3600;
  if (hoursRemaining < 2) return 'text-red-500';
  if (hoursRemaining < 6) return 'text-amber-500';
  return 'text-emerald-500';
}

// --- Copy Button Component ---

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, [value, label]);

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title={`Copy ${label}`}
      type="button"
    >
      {copied ? (
        <CheckCircle className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

// --- Main Page Component ---

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();

  const orderId = params.id as string;

  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [totalWindowSeconds, setTotalWindowSeconds] = useState(0);

  // "I've initiated my transfer" state
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [transferRef, setTransferRef] = useState('');

  const hasFetched = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Fetch status ---
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/bank-transfer/${orderId}/status`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Status ${res.status}`);
      }
      const json: StatusResponse = await res.json();
      setData(json);
      setError(null);

      if (json.status === 'awaiting_transfer') {
        const remaining = Math.max(0, json.timeRemainingSeconds);
        setCountdown(remaining);

        // Calculate total window from deadline and created time on first fetch
        if (totalWindowSeconds === 0) {
          const deadlineMs = new Date(json.paymentDeadline).getTime();
          // Default to 24 hours if we can't calculate
          const windowMs = deadlineMs - (deadlineMs - remaining * 1000);
          setTotalWindowSeconds(windowMs > 0 ? Math.floor(windowMs / 1000) : 86400);
        }
      }

      // If succeeded, redirect after brief delay
      if (json.status === 'succeeded') {
        setTimeout(() => {
          router.push(`/order-confirmation?orderId=${orderId}`);
        }, 2000);
      }

      return json;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load invoice';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderId, router, totalWindowSeconds]);

  // --- Initial load + polling ---
  useEffect(() => {
    if (!isUserLoaded) return;
    if (!user) {
      router.push('/sign-in');
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchStatus();

    // Poll every 60 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, 60000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isUserLoaded, user, router, fetchStatus]);

  // --- Countdown timer (1s interval) ---
  useEffect(() => {
    if (!data || data.status !== 'awaiting_transfer') return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Deadline reached — trigger a re-fetch to get the server-side expired status
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [data?.status, fetchStatus]);

  // Set total window on first data load
  useEffect(() => {
    if (data && data.status === 'awaiting_transfer' && totalWindowSeconds === 0) {
      // Use 24h as default window
      setTotalWindowSeconds(86400);
    }
  }, [data, totalWindowSeconds]);

  // --- Notify transferred handler ---
  const handleNotifyTransferred = async () => {
    setNotifying(true);
    try {
      const body: Record<string, string> = {};
      if (transferRef.trim()) {
        body.transferReference = transferRef.trim();
      }
      const res = await fetch(`/api/bank-transfer/${orderId}/notify-transferred`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to send notification');
      }
      setNotified(true);
      toast.success('Transfer notification sent successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to notify';
      toast.error(message);
    } finally {
      setNotifying(false);
    }
  };

  // --- Loading state ---
  if (loading || !isUserLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-foreground">Loading invoice...</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Invoice</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                hasFetched.current = false;
                fetchStatus();
              }}
              className="px-6 py-3 bg-primary text-primary-foreground hover:opacity-90 font-semibold rounded-lg transition-opacity"
            >
              Try Again
            </button>
            <Link
              href="/products"
              className="px-6 py-3 bg-muted text-muted-foreground hover:bg-muted/80 font-semibold rounded-lg text-center transition-colors"
            >
              Return to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Hold pending state ---
  if (data?.status === 'hold_pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Processing Your Order</h1>
          <p className="text-muted-foreground">
            We are securing your card hold. This page will update automatically.
          </p>
        </div>
      </div>
    );
  }

  // --- Succeeded state ---
  if (data?.status === 'succeeded') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Confirmed!</h1>
          <p className="text-muted-foreground mb-4">
            Your bank transfer has been verified. Redirecting to your order confirmation...
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  // --- Expired / Cancelled state ---
  if (data?.status === 'expired' || data?.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {data.status === 'expired' ? 'Payment Deadline Expired' : 'Order Cancelled'}
            </h1>
            <p className="text-muted-foreground">
              Reference: <span className="font-mono">{data.referenceCode}</span>
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-card-foreground">
                <p className="font-semibold">What happens now?</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    The card hold on your account may be captured proportionally if the metal price
                    has dropped since your order, as per the market loss policy you accepted.
                  </li>
                  <li>
                    If no market loss occurred, the hold will be released back to your card. This
                    may take 3-7 business days depending on your bank.
                  </li>
                  <li>
                    If you believe this is an error, please contact us immediately.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-3 bg-primary text-primary-foreground hover:opacity-90 font-semibold rounded-lg text-center transition-opacity"
            >
              Browse Products
            </Link>
            <a
              href="mailto:support@australiannationalbullion.com.au"
              className="px-8 py-3 bg-muted text-muted-foreground hover:bg-muted/80 font-semibold rounded-lg text-center transition-colors"
            >
              Contact Support
            </a>
          </div>

          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>
              Need help? Contact us at{' '}
              <a
                href="mailto:support@australiannationalbullion.com.au"
                className="text-primary hover:underline"
              >
                support@australiannationalbullion.com.au
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Awaiting transfer state (main invoice view) ---
  if (data?.status !== 'awaiting_transfer') return null;

  const progressPercent =
    totalWindowSeconds > 0
      ? Math.max(0, Math.min(100, ((totalWindowSeconds - countdown) / totalWindowSeconds) * 100))
      : 0;
  const isDeadlinePassed = countdown <= 0;

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">Bank Transfer Invoice</h1>
          <p className="text-muted-foreground">
            Complete your payment within the time shown below
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${getProgressBarColor(countdown)}`} />
              <span className="font-semibold text-card-foreground">Time Remaining</span>
            </div>
            <span
              className={`text-2xl sm:text-3xl font-mono font-bold ${getProgressBarColor(countdown)}`}
            >
              {isDeadlinePassed ? 'EXPIRED' : formatCountdown(countdown)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(countdown, totalWindowSeconds)}`}
              style={{ width: `${100 - progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Payment deadline:{' '}
            {new Date(data.paymentDeadline).toLocaleString('en-AU', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
        </div>

        {/* Amount Due */}
        <div className="bg-card border-2 border-yellow-500/50 rounded-lg shadow-md p-6 mb-6 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Amount Due
          </p>
          <p className="text-4xl sm:text-5xl font-bold text-yellow-500">
            {formatCurrency(data.amountAud)}
          </p>
          <div className="flex items-center justify-center mt-2">
            <CopyButton value={data.amountAud.toFixed(2)} label="Amount" />
            <span className="text-xs text-muted-foreground ml-1">Copy amount</span>
          </div>
        </div>

        {/* Reference Code */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Payment Reference (REQUIRED)
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-foreground bg-muted px-4 py-2 rounded-lg">
                {data.referenceCode}
              </span>
              <CopyButton value={data.referenceCode} label="Reference code" />
            </div>
            <p className="text-xs text-red-500 mt-2 font-medium">
              You MUST include this reference in your bank transfer description
            </p>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-card-foreground mb-4">Bank Transfer Details</h2>
          <div className="space-y-3">
            <BankDetailRow label="Bank Name" value={data.bankName} />
            <BankDetailRow label="BSB" value={data.bsb} copyable />
            <BankDetailRow label="Account Number" value={data.accountNumber} copyable />
            <BankDetailRow label="Account Name" value={data.accountName} copyable />
            {data.payidIdentifier && (
              <>
                <div className="border-t border-border my-3" />
                <BankDetailRow
                  label={`PayID (${data.payidType || 'Email'})`}
                  value={data.payidIdentifier}
                  copyable
                />
              </>
            )}
          </div>
        </div>

        {/* Card Hold Disclosure */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-5 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Card Hold</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                A temporary hold of{' '}
                <span className="font-semibold">{formatCurrency(data.depositAmountAud)}</span>{' '}
                has been placed on your card. This is not a charge. It will be released once we
                confirm your bank transfer.
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Instructions */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                Important Transfer Instructions
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-yellow-700 dark:text-yellow-400">
                <li>
                  The bank transfer <strong>must come from a bank account in your name</strong>
                </li>
                <li>
                  Use the <strong>exact reference code</strong> above in your transfer description
                </li>
                <li>
                  Ensure the <strong>exact amount</strong> of{' '}
                  <strong>{formatCurrency(data.amountAud)}</strong> is transferred
                </li>
                <li>
                  Transfers typically take <strong>1-2 business days</strong> to clear
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Notify Transfer Section */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-card-foreground mb-2">
            Sent your transfer?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Let us know once you have initiated the bank transfer. This helps us process your order
            faster. This is optional and informational only.
          </p>

          {notified ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Notification sent — we will verify your transfer shortly</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="transferRef"
                  className="block text-sm font-medium text-card-foreground mb-1"
                >
                  Your bank reference number (optional)
                </label>
                <input
                  id="transferRef"
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. TRF-123456789"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={handleNotifyTransferred}
                disabled={notifying}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-semibold rounded-lg transition-opacity"
              >
                {notifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    I have initiated my transfer
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Support */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Need help? Contact our support team at{' '}
            <a
              href="mailto:support@australiannationalbullion.com.au"
              className="text-primary hover:underline"
            >
              support@australiannationalbullion.com.au
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Bank Detail Row subcomponent ---

function BankDetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono font-medium text-card-foreground">{value}</span>
        {copyable && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}
