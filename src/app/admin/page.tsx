'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger('ADMIN DASHBOARD')

interface BankTransferOrderRow {
  id: string;
  payment_deadline: string;
  status: string;
}

interface DashboardStats {
  pendingDocuments: number;
  flaggedTransactions: number;
  activeInvestigations: number;
  pendingTTRs: number;
  totalCustomers: number;
  verifiedCustomers: number;
  recentTransactionsCount: number;
  totalTransactionValue: number;
  suspiciousReports: number;
  staffRequiringTraining: number;
  overdueTraining: number;
  eddReviewsPending: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [btAwaitingCount, setBtAwaitingCount] = useState(0);
  const [btUrgent, setBtUrgent] = useState(false);

  const fetchBankTransferStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bank-transfer/list?status=awaiting_transfer&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      const orders: BankTransferOrderRow[] = data.data || [];
      setBtAwaitingCount(orders.length);
      // Check if any are <2hrs from expiry
      const now = Date.now();
      const hasUrgent = orders.some((o) => {
        const deadline = new Date(o.payment_deadline).getTime();
        return (deadline - now) < 2 * 60 * 60 * 1000;
      });
      setBtUrgent(hasUrgent);
    } catch {
      // Non-critical, silently fail
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchDashboardStats();
    fetchBankTransferStats();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardStats();
        fetchBankTransferStats();
      }
    };
    const handleFocus = () => {
      fetchDashboardStats();
      fetchBankTransferStats();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/dashboard?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });


      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const data = await response.json();
      logger.log()
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-6 py-4 rounded-lg">
          <h2 className="font-semibold mb-2">Error Loading Dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const verificationRate = stats?.totalCustomers 
    ? ((stats.verifiedCustomers / stats.totalCustomers) * 100).toFixed(1)
    : 0;

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of key metrics and pending actions</p>
        </div>

        {/* Action Items - Items requiring attention */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">⚠️ Action Required</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ActionCard
              title="Document Verifications"
              count={stats?.pendingDocuments || 0}
              link="/admin/document-verification"
              color="blue"
              icon="📄"
            />
            <ActionCard
              title="Flagged Transactions"
              count={stats?.flaggedTransactions || 0}
              link="/admin/reviews"
              color="red"
              icon="🚩"
            />
            <ActionCard
              title="Active EDD Investigations"
              count={stats?.activeInvestigations || 0}
              link="/admin/edd-investigations"
              color="purple"
              icon="🔬"
            />
            <ActionCard
              title="Pending TTRs"
              count={stats?.pendingTTRs || 0}
              link="/admin/ttr-reports"
              color="yellow"
              icon="📊"
            />
            <ActionCard
              title="Suspicious Reports"
              count={stats?.suspiciousReports || 0}
              link="/admin/suspicious-reports"
              color="orange"
              icon="⚠️"
            />
            <ActionCard
              title="EDD Reviews"
              count={stats?.eddReviewsPending || 0}
              link="/admin/edd-reviews"
              color="blue"
              icon="📋"
            />
            <ActionCard
              title="Bank Transfers Pending"
              count={btAwaitingCount}
              link="/admin/bank-transfers"
              color={btUrgent ? 'red' : btAwaitingCount > 0 ? 'orange' : 'blue'}
              icon="🏦"
            />
          </div>
        </div>

        {/* Training Compliance - Separate section if overdue */}
        {(stats?.overdueTraining ?? 0) > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">🎓 Training Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ActionCard
                title="Overdue Training"
                count={stats?.overdueTraining || 0}
                link="/admin/staff"
                color="red"
                icon="⏰"
              />
            </div>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">📈 Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              subtitle={`${stats?.verifiedCustomers || 0} verified (${verificationRate}%)`}
              icon="👥"
              color="green"
            />
            <StatCard
              title="Recent Transactions"
              value={stats?.recentTransactionsCount || 0}
              subtitle="Last 30 days"
              icon="💰"
              color="purple"
            />
            <StatCard
              title="Transaction Value"
              value={` AUD $${(stats?.totalTransactionValue || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle="Last 30 days"
              icon="💵"
              color="indigo"
            />
            <StatCard
              title="Verification Rate"
              value={`${verificationRate}%`}
              subtitle={`${stats?.verifiedCustomers || 0} of ${stats?.totalCustomers || 0}`}
              icon="✓"
              color="teal"
            />
            <StatCard
              title="Staff Training"
              value={stats?.staffRequiringTraining || 0}
              subtitle={`${stats?.overdueTraining || 0} overdue`}
              icon="🎓"
              color="green"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">🔗 Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLink
              title="Document Verification"
              description="Review customer identity documents"
              link="/admin/document-verification"
              icon="📄"
            />
            <QuickLink
              title="Transaction Reviews"
              description="Review flagged transactions"
              link="/admin/reviews"
              icon="🔍"
            />
            <QuickLink
              title="EDD Investigations"
              description="Manage Enhanced Due Diligence investigations"
              link="/admin/edd-investigations"
              icon="🔬"
            />
            <QuickLink
                title="EDD Reviews"
                description="Review EDD Form Submissions"
                link="/admin/edd-reviews"
                icon="⚙️"
            />
            <QuickLink
              title="TTR Reports"
              description="Generate and submit TTR reports"
              link="/admin/ttr-reports"
              icon="📊"
            />
            <QuickLink
              title="Customer Management"
              description="View and manage customers"
              link="/admin/customers"
              icon="👤"
            />
            <QuickLink
              title="Staff Training"
              description="AML/CTF training compliance register"
              link="/admin/staff"
              icon="🎓"
            />
            <QuickLink
              title="Reports & Analytics"
              description="Generate compliance and AUSTRAC reports"
              link="/admin/reports"
              icon="📊"
            />
            <QuickLink
              title="Audit Logs"
              description="View system audit trail"
              link="/admin/audit-logs"
              icon="📝"
            />
            <QuickLink
              title="Bank Transfers"
              description="Manage bank transfer orders"
              link="/admin/bank-transfers"
              icon="🏦"
            />
            <QuickLink
              title="BT Settings"
              description="Bank transfer payment configuration"
              link="/admin/settings/bank-transfer"
              icon="⚙️"
            />
          </div>
        </div>
    </div>
  );
}

function ActionCard({ 
  title, 
  count, 
  link, 
  color, 
  icon 
}: { 
  title: string; 
  count: number; 
  link: string; 
  color: string; 
  icon: string;
}) {
  const colorClasses = {
    blue: 'bg-primary/10 border-primary/30 text-primary-foreground',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  const hoverClasses = {
    blue: 'hover:bg-primary/20',
    red: 'hover:bg-red-100',
    yellow: 'hover:bg-yellow-100',
    orange: 'hover:bg-orange-100',
  };

  return (
    <Link href={link}>
      <div className={`${colorClasses[color as keyof typeof colorClasses]} ${hoverClasses[color as keyof typeof hoverClasses]} border-2 rounded-lg p-6 transition-all cursor-pointer shadow-sm hover:shadow-md`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl">{icon}</span>
          <span className="text-4xl font-bold">{count}</span>
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {count > 0 && (
          <p className="text-sm mt-1 opacity-75">Click to review →</p>
        )}
      </div>
    </Link>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: string; 
  color: string;
}) {
  const colorClasses = {
    green: 'bg-card border-green-500/30',
    purple: 'bg-card border-purple-500/30',
    indigo: 'bg-card border-indigo-500/30',
    teal: 'bg-card border-teal-500/30',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border-2 rounded-lg p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-3xl font-bold text-card-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function QuickLink({ 
  title, 
  description, 
  link, 
  icon 
}: { 
  title: string; 
  description: string; 
  link: string; 
  icon: string;
}) {
  return (
    <Link href={link}>
      <div className="bg-card border-2 border-border rounded-lg p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-card-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
