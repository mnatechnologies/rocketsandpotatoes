'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type TabType = 'compliance' | 'austrac';

export default function AdminReportsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('compliance');
  const isAdmin = user?.publicMetadata?.role === 'admin';

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push('/');
    }
  }, [isLoaded, isAdmin, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Generate compliance reports and track AUSTRAC submissions
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('compliance')}
              className={`${
                activeTab === 'compliance'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              📊 Compliance Report
            </button>
            <button
              onClick={() => setActiveTab('austrac')}
              className={`${
                activeTab === 'austrac'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              📝 AUSTRAC Reports Tracker
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'compliance' && <ComplianceReportTab />}
        {activeTab === 'austrac' && <AustracTrackerTab />}
      </div>
    </div>
  );
}

// Compliance Report Tab Component
function ComplianceReportTab() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports/compliance?year=${year}`);
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
        toast.success('Report generated successfully');
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;

    const rows = [
      ['Annual Compliance Report', year],
      [],
      ['TRANSACTION METRICS'],
      ['Total Transactions', reportData.transactions.total],
      ['Total Value (AUD)', `$${reportData.transactions.totalValue.toFixed(2)}`],
      [],
      ['AUSTRAC REPORTS'],
      ['TTRs Submitted', reportData.austracReports.ttrsSubmitted],
      ['TTRs Pending', reportData.austracReports.ttrsPending],
      ['SARs Total', reportData.austracReports.sarsTotal],
      ['SARs Submitted', reportData.austracReports.sarsSubmitted],
      [],
      ['CUSTOMER VERIFICATION'],
      ['Total Customers', reportData.customerVerification.totalCustomers],
      ['Verified Customers', reportData.customerVerification.verifiedCustomers],
      ['Verification Rate', `${reportData.customerVerification.verificationRate}%`],
      ['Documents Reviewed', reportData.customerVerification.documentsReviewed],
      [],
      ['STAFF TRAINING'],
      ['Staff Trained', reportData.staffTraining.staffTrained],
      ['Training Sessions Completed', reportData.staffTraining.trainingSessionsCompleted],
      [],
      ['MONTHLY BREAKDOWN'],
      ['Month', 'Transactions', 'Value (AUD)'],
      ...reportData.transactions.monthly.map((m: any) => [m.month, m.count, `$${m.value.toFixed(2)}`]),
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${year}.csv`;
    a.click();
    toast.success('Report exported successfully');
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <button
              onClick={exportCSV}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:opacity-90 font-semibold"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="space-y-6">
          {/* Transaction Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Transaction Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Transactions</div>
                <div className="text-2xl font-bold text-primary">{reportData.transactions.total}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Value (AUD)</div>
                <div className="text-2xl font-bold text-primary">
                  ${reportData.transactions.totalValue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* AUSTRAC Reports */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">AUSTRAC Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">TTRs Submitted</div>
                <div className="text-2xl font-bold text-green-600">{reportData.austracReports.ttrsSubmitted}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">TTRs Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{reportData.austracReports.ttrsPending}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">SARs Total</div>
                <div className="text-2xl font-bold text-orange-600">{reportData.austracReports.sarsTotal}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">SARs Submitted</div>
                <div className="text-2xl font-bold text-green-600">{reportData.austracReports.sarsSubmitted}</div>
              </div>
            </div>
          </div>

          {/* Customer Verification */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Customers</div>
                <div className="text-2xl font-bold text-primary">{reportData.customerVerification.totalCustomers}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">Verified</div>
                <div className="text-2xl font-bold text-green-600">{reportData.customerVerification.verifiedCustomers}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">Verification Rate</div>
                <div className="text-2xl font-bold text-primary">{reportData.customerVerification.verificationRate}%</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">Documents Reviewed</div>
                <div className="text-2xl font-bold text-primary">{reportData.customerVerification.documentsReviewed}</div>
              </div>
            </div>
          </div>

          {/* Staff Training */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Staff Training</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">Staff Trained</div>
                <div className="text-2xl font-bold text-primary">{reportData.staffTraining.staffTrained}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600">Training Sessions Completed</div>
                <div className="text-2xl font-bold text-primary">{reportData.staffTraining.trainingSessionsCompleted}</div>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value (AUD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.transactions.monthly.map((month: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-900">{month.month}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{month.count}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        ${month.value.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// AUSTRAC Tracker Tab Component
function AustracTrackerTab() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/reports/austrac?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReports(data.data);
        setSummary(data.summary);
      } else {
        toast.error('Failed to load reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportCSV = () => {
    if (reports.length === 0) {
      toast.error('No reports to export');
      return;
    }

    const rows = [
      ['AUSTRAC Reports Tracker'],
      ['Type', 'Reference', 'Date', 'Status', 'Customer Name', 'Customer Email', 'Amount/Details'],
      ...reports.map(r => [
        r.type,
        r.reference || 'N/A',
        new Date(r.date).toLocaleDateString(),
        r.status,
        r.customerName,
        r.customerEmail,
        r.amount ? `$${r.amount.toFixed(2)}` : (r.transactionCount ? `${r.transactionCount} transactions` : 'N/A'),
      ]),
    ];

    const csv = rows.map((row: any[]) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `austrac-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Reports exported successfully');
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="all">All Reports</option>
              <option value="ttr">TTRs Only</option>
              <option value="sar">SARs Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Reference, customer name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          {reports.length > 0 && (
            <button
              onClick={exportCSV}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:opacity-90 font-semibold"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Total Reports</div>
            <div className="text-2xl font-bold text-primary">{summary.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">TTRs</div>
            <div className="text-2xl font-bold text-blue-600">{summary.ttrs}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">SARs</div>
            <div className="text-2xl font-bold text-orange-600">{summary.sars}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Submitted</div>
            <div className="text-2xl font-bold text-green-600">{summary.submitted}</div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading reports...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No reports found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              reports.map((report, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      report.type === 'TTR' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.reference || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      report.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{report.customerName}</div>
                    <div className="text-xs text-gray-500">{report.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.amount && `$${report.amount.toFixed(2)} ${report.currency || 'AUD'}`}
                    {report.transactionCount && `${report.transactionCount} transactions`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
