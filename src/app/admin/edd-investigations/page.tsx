'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createLogger} from "@/lib/utils/logger";
import { useUser } from '@clerk/nextjs';

const logger = createLogger('EDD_INVESTIGATIONS_PAGE')

type InvestigationStatus = 'open' | 'awaiting_customer_info' | 'under_review' | 'escalated' | 'completed_approved' | 'completed_rejected' | 'completed_ongoing_monitoring';

interface Investigation {
  id: string;
  investigation_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_risk_level: string;
  customer_is_pep: boolean;
  transaction_amount_aud?: number;
  status: InvestigationStatus;
  trigger_reason: string;
  triggered_by: string;
  opened_at: string;
  completed_at: string | null;
  compliance_recommendation: string | null;
  approved_by_management: boolean;
  // Checklist sections
  customer_information_review: any;
  employment_verification: any;
  source_of_wealth: any;
  source_of_funds: any;
  transaction_pattern_analysis: any;
  additional_information: any;
  // Outcomes
  investigation_findings: string | null;
  risk_assessment_summary: string | null;
  // Actions
  information_requests: any[];
  escalations: any[];
}

export default function EDDInvestigationsPage() {
  const { isLoaded } = useAuth();
  const { user } = useUser();
  const isManagementUser = user?.publicMetadata?.role === 'admin' || 
                        user?.publicMetadata?.role === 'manager';
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'timeline' | 'complete'>('checklist');

  useEffect(() => {
    if (isLoaded) {
      fetchInvestigations();
    }
  }, [isLoaded, statusFilter]);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/edd-investigations?status=${statusFilter}`);
      const data = await response.json();
      setInvestigations(data.investigations || []);
    } catch (error) {
      logger.error('Failed to fetch investigations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistSection = async (investigationId: string, sectionName: string, sectionData: any) => {
    try {
      const response = await fetch('/api/admin/edd-investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_checklist',
          investigationId,
          section_name: sectionName,
          section_data: sectionData,
        }),
      });

      if (!response.ok) throw new Error('Failed to update checklist');

      alert('Checklist section updated successfully');
      fetchInvestigations();
    } catch (error) {
      alert('Failed to update checklist section');
      logger.error(error);
    }
  };

  const requestInformation = async (investigationId: string) => {
    const itemsInput = prompt('Enter requested items (comma-separated):');
    if (!itemsInput) return;

    const items = itemsInput.split(',').map(item => item.trim());
    const deadline = prompt('Enter deadline (YYYY-MM-DD) or leave empty:');

    try {
      const response = await fetch('/api/admin/edd-investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_information',
          investigationId,
          items,
          deadline: deadline || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to request information');

      alert('Information request sent successfully');
      fetchInvestigations();
    } catch (error) {
      alert('Failed to send information request');
      logger.error(error);
    }
  };

  const completeInvestigation = async (investigationId: string, findings: string, assessment: string, recommendation: string) => {
    if (!findings || !assessment || !recommendation) {
      alert('All fields required: findings, assessment, and recommendation');
      return;
    }

    try {
      const response = await fetch('/api/admin/edd-investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          investigationId,
          investigation_findings: findings,
          risk_assessment_summary: assessment,
          compliance_recommendation: recommendation,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete investigation');
      }

      alert(`Investigation completed successfully! Monitoring level: ${result.monitoring_level}`);
      fetchInvestigations();
      setExpandedId(null);
    } catch (error: any) {
      alert(error.message || 'Failed to complete investigation');
      logger.error(error);
    }
  };
  const approveManagement = async (investigationId: string) => {
    try {
      const response = await fetch('/api/admin/edd-investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_management',
          investigationId,
        }),
      });
  
      if (!response.ok) throw new Error('Failed to approve');
  
      alert('Management approval granted successfully');
      fetchInvestigations();
    } catch (error) {
      alert('Failed to grant management approval');
      logger.error(error);
    }
  };

  const getStatusBadge = (status: InvestigationStatus) => {
    const badges: Record<InvestigationStatus, string> = {
      open: 'bg-blue-100 text-blue-800',
      awaiting_customer_info: 'bg-amber-100 text-amber-800',
      under_review: 'bg-purple-100 text-purple-800',
      escalated: 'bg-red-100 text-red-800',
      completed_approved: 'bg-green-100 text-green-800',
      completed_rejected: 'bg-gray-100 text-gray-800',
      completed_ongoing_monitoring: 'bg-teal-100 text-teal-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: InvestigationStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isLoaded || loading) {
    return <div className="p-8">Loading investigations...</div>;
  }

  return (
    <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">EDD Investigations</h1>
          <p className="text-secondary">Enhanced Due Diligence compliance investigations</p>
        </div>

        {/* Status Filters */}
        <div className="mb-6 flex gap-2">
          {['active', 'awaiting_customer_info', 'escalated', 'completed_approved', 'all'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filter === 'all' ? 'All' : getStatusLabel(filter as InvestigationStatus)}
            </button>
          ))}
        </div>

        {/* Investigations List */}
        <div className="space-y-4">
          {investigations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No investigations found for the selected filter.
            </div>
          ) : (
            investigations.map((inv) => (
              <InvestigationCard
                key={inv.id}
                investigation={inv}
                isExpanded={expandedId === inv.id}
                onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onUpdateChecklist={updateChecklistSection}
                onRequestInformation={requestInformation}
                onComplete={completeInvestigation}
                onApproveManagement={approveManagement}
                isManagementUser={isManagementUser}
              />
            ))
          )}
    </div>
    </div>
  );
}

interface InvestigationCardProps {
  investigation: Investigation;
  isExpanded: boolean;
  onToggle: () => void;
  activeTab: 'checklist' | 'timeline' | 'complete';
  setActiveTab: (tab: 'checklist' | 'timeline' | 'complete') => void;
  onUpdateChecklist: (id: string, section: string, data: any) => void;
  onRequestInformation: (id: string) => void;
  onComplete: (id: string, findings: string, assessment: string, recommendation: string) => void;
  onApproveManagement: (id: string) => void;
  isManagementUser: boolean;
}

function InvestigationCard({
  investigation,
  isExpanded,
  onToggle,
  activeTab,
  setActiveTab,
  onUpdateChecklist,
  onRequestInformation,
  onComplete,
  onApproveManagement,
  isManagementUser,
}: InvestigationCardProps) {
  const [findings, setFindings] = useState(investigation.investigation_findings || '');
  const [assessment, setAssessment] = useState(investigation.risk_assessment_summary || '');
  const [recommendation, setRecommendation] = useState(investigation.compliance_recommendation || '');

  const getStatusBadge = (status: InvestigationStatus) => {
    const badges: Record<InvestigationStatus, string> = {
      open: 'bg-blue-100 text-blue-800',
      awaiting_customer_info: 'bg-amber-100 text-amber-800',
      under_review: 'bg-purple-100 text-purple-800',
      escalated: 'bg-red-100 text-red-800',
      completed_approved: 'bg-green-100 text-green-800',
      completed_rejected: 'bg-gray-100 text-gray-800',
      completed_ongoing_monitoring: 'bg-teal-100 text-teal-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: InvestigationStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isCompleted = investigation.status.startsWith('completed_');

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Card Header */}
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {investigation.investigation_number}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(investigation.status)}`}>
                {getStatusLabel(investigation.status)}
              </span>
              {investigation.customer_is_pep && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  PEP
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Customer:</span>{' '}
                <span className="font-medium text-primary-foreground">{investigation.customer_name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{' '}
                <span className="font-medium text-primary-foreground">{investigation.customer_email}</span>
              </div>
              <div>
                <span className="text-gray-500">Trigger:</span>{' '}
                <span className="font-medium text-primary-foreground">{investigation.triggered_by}</span>
              </div>
              <div>
                <span className="text-gray-500">Opened:</span>{' '}
                <span className="font-medium text-primary-foreground">{new Date(investigation.opened_at).toLocaleDateString()}</span>
              </div>
              {investigation.transaction_amount_aud && (
                <div>
                  <span className="text-gray-500">Amount:</span>{' '}
                  <span className="font-medium text-primary-foreground">${investigation.transaction_amount_aud.toLocaleString()} AUD</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Risk Level:</span>{' '}
                <span className={`font-medium ${investigation.customer_risk_level === 'high' ? 'text-red-600' : 'text-gray-900'}`}>
                  {investigation.customer_risk_level || 'Unknown'}
                </span>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-600">{investigation.trigger_reason}</p>
          </div>

          <div className="ml-4">
            <svg
              className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'checklist'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Investigation Checklist
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'timeline'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline & Requests
            </button>
            <button
              onClick={() => setActiveTab('complete')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'complete'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={isCompleted}
            >
              Complete Investigation
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'checklist' && (
              <ChecklistTab investigation={investigation} onUpdate={onUpdateChecklist} />
            )}

            {activeTab === 'timeline' && (
              <TimelineTab investigation={investigation} onRequestInformation={onRequestInformation} onApproveManagement={onApproveManagement} isManagementUser={isManagementUser} />
            )}

            {activeTab === 'complete' && !isCompleted && (
              <CompleteTab
                investigation={investigation}
                findings={findings}
                setFindings={setFindings}
                assessment={assessment}
                setAssessment={setAssessment}
                recommendation={recommendation}
                setRecommendation={setRecommendation}
                onComplete={onComplete}
              />
            )}

            {activeTab === 'complete' && isCompleted && (
              <div className="text-center py-8 text-gray-500">
                Investigation already completed on {new Date(investigation.completed_at!).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistTab({ investigation, onUpdate }: { investigation: Investigation; onUpdate: (id: string, section: string, data: any) => void }) {
  const sections = [
    { key: 'customer_information_review', label: 'Customer Information Review' },
    { key: 'employment_verification', label: 'Employment Verification' },
    { key: 'source_of_wealth', label: 'Source of Wealth' },
    { key: 'source_of_funds', label: 'Source of Funds' },
    { key: 'transaction_pattern_analysis', label: 'Transaction Pattern Analysis' },
    { key: 'additional_information', label: 'Additional Information' },
  ];

  const handleToggleSection = (sectionKey: string) => {
    const section = (investigation as any)[sectionKey];
    const newCompleted = !section.completed;

    if (newCompleted) {
      const notes = prompt(`Enter notes for ${sections.find(s => s.key === sectionKey)?.label}:`);
      onUpdate(investigation.id, sectionKey, { ...section, completed: true, verified: true, notes });
    } else {
      onUpdate(investigation.id, sectionKey, { ...section, completed: false, verified: false });
    }
  };

  return (
    <div className="space-y-4">
      {sections.map(({ key, label }) => {
        const section = (investigation as any)[key];
        const isCompleted = section?.completed || false;

        return (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => handleToggleSection(key)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="font-medium text-gray-900">{label}</span>
              </div>
              {isCompleted && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Completed
                </span>
              )}
            </div>
            {section?.notes && (
              <p className="mt-2 text-sm text-gray-600 ml-8">{section.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TimelineTab({ investigation, onRequestInformation, onApproveManagement, isManagementUser }: { investigation: Investigation; onRequestInformation: (id: string) => void; onApproveManagement: (id: string) => void; isManagementUser: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Information Requests</h3>
          <button
            onClick={() => onRequestInformation(investigation.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Request Information
          </button>
        </div>

        {isManagementUser && investigation.status === 'escalated' && (
          <button
            onClick={() => onApproveManagement(investigation.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition ml-2"
          >
            Management Approve
          </button>
        )}

        {investigation.information_requests && investigation.information_requests.length > 0 ? (
          <div className="space-y-3">
            {investigation.information_requests.map((req: any) => (
              <div key={req.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {new Date(req.requested_at).toLocaleDateString()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    req.status === 'received' ? 'bg-green-100 text-green-800' :
                    req.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Items requested:</span>
                  <ul className="list-disc list-inside mt-1">
                    {req.items.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  {req.deadline && <p className="mt-2">Deadline: {new Date(req.deadline).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No information requests sent yet</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalations</h3>
        {investigation.escalations && investigation.escalations.length > 0 ? (
          <div className="space-y-3">
            {investigation.escalations.map((esc: any) => (
              <div key={esc.id} className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    Escalated to {esc.escalated_to}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(esc.escalated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{esc.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No escalations</p>
        )}
      </div>
    </div>
  );
}

function CompleteTab({
  investigation,
  findings,
  setFindings,
  assessment,
  setAssessment,
  recommendation,
  setRecommendation,
  onComplete,
}: {
  investigation: Investigation;
  findings: string;
  setFindings: (v: string) => void;
  assessment: string;
  setAssessment: (v: string) => void;
  recommendation: string;
  setRecommendation: (v: string) => void;
  onComplete: (id: string, findings: string, assessment: string, recommendation: string) => void;
}) {
  const { user } = useUser();
  const isAdminUser = user?.publicMetadata?.role === 'admin';
  const highRiskDecisions = ['reject_relationship', 'escalate_to_smr'];
  const requiresApproval = recommendation && highRiskDecisions.includes(recommendation);
  const hasApproval = investigation.approved_by_management;

  const canComplete = findings && assessment && recommendation && (!requiresApproval || hasApproval || isAdminUser);

  const decisions = [
    { value: 'approve_relationship', label: 'Approve Relationship (Standard Monitoring)', level: 'standard' },
    { value: 'ongoing_monitoring', label: 'Approve with Ongoing Enhanced Monitoring', level: 'ongoing_review' },
    { value: 'enhanced_monitoring', label: 'Approve with Continuous Enhanced Monitoring', level: 'enhanced' },
    { value: 'reject_relationship', label: 'Reject & Block Customer (Requires Management)', level: 'blocked' },
    { value: 'escalate_to_smr', label: 'Escalate to SMR & Block (Requires Management)', level: 'blocked' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Investigation Findings *
        </label>
        <textarea
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border text-primary-foreground border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Summarize the key findings from your investigation..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Risk Assessment Summary *
        </label>
        <textarea
          value={assessment}
          onChange={(e) => setAssessment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border text-primary-foreground border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Assess the overall risk level and implications..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compliance Decision *
        </label>
        <select
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          className="w-full px-3 py-2 border text-primary-foreground border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a decision...</option>
          {decisions.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        {recommendation && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Impact:</span> Customer monitoring level will be set to{' '}
              <span className="font-semibold">{decisions.find(d => d.value === recommendation)?.level}</span>
            </p>
            {highRiskDecisions.includes(recommendation) && (
              <p className="text-sm text-red-900 mt-2">
                ⚠️ This decision requires management approval
              </p>
            )}
          </div>
        )}
      </div>

      {requiresApproval && !hasApproval && !isAdminUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-900 font-medium">Management approval required</p>
          <p className="text-sm text-amber-700 mt-1">
            A manager must approve this decision before you can complete the investigation.
          </p>
        </div>
      )}

      <button
        onClick={() => onComplete(investigation.id, findings, assessment, recommendation)}
        disabled={!canComplete}
        className={`w-full cursor-pointer py-3 rounded-lg font-medium transition ${
          canComplete
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {requiresApproval && !hasApproval && !isAdminUser
          ? 'Awaiting Management Approval'
          : 'Complete Investigation'}
      </button>
    </div>
  );
}
