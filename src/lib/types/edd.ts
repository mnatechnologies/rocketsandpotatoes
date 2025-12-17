// EDD Investigation TypeScript Types
// Type definitions for Enhanced Due Diligence investigation structures

// Base checklist section interface
export interface ChecklistSection {
  completed: boolean;
  findings: string | null;
  notes: string | null;
  verified: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
}

// Employment verification checklist
export interface EmploymentVerification extends ChecklistSection {
  occupation: string | null;
  employer: string | null;
  position: string | null;
  length_of_employment: string | null;
}

// Source of wealth verification
export interface SourceOfWealth extends ChecklistSection {
  primary_source: string | null;
  documentation_type: string | null;
  documentation_verified: boolean;
}

// Source of funds verification
export interface SourceOfFunds extends ChecklistSection {
  funding_source: string | null;
  bank_statements_verified: boolean;
  supporting_documents: string[];
}

// Transaction pattern analysis
export interface TransactionPatternAnalysis extends ChecklistSection {
  unusual_activity: boolean;
  pattern_description: string | null;
  compared_to_similar_customers: boolean;
}

// Additional information collection
export interface AdditionalInformation extends ChecklistSection {
  information_requested: string[];
  information_received: string[];
}

// Information request tracking
export interface InformationRequest {
  id: string;
  requested_at: string;
  requested_by: string;
  items: string[];
  deadline: string | null;
  status: 'pending' | 'received' | 'overdue';
  received_at: string | null;
  response_notes: string | null;
}

// Escalation tracking
export interface Escalation {
  id: string;
  escalated_at: string;
  escalated_by: string;
  escalated_to: string;
  reason: string;
  resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
}

// Investigation status enum
export type InvestigationStatus =
  | 'open'
  | 'awaiting_customer_info'
  | 'under_review'
  | 'escalated'
  | 'completed_approved'
  | 'completed_rejected'
  | 'completed_ongoing_monitoring';

// Trigger type enum
export type TriggerType = 'system' | 'admin' | 'transaction_review';

// Compliance recommendation enum
export type ComplianceRecommendation =
  | 'approve_relationship'
  | 'ongoing_monitoring'
  | 'enhanced_monitoring'
  | 'reject_relationship'
  | 'escalate_to_smr';

// Monitoring level enum
export type MonitoringLevel = 'standard' | 'ongoing_review' | 'enhanced' | 'blocked';

// Full EDD investigation interface
export interface EDDInvestigation {
  id: string;
  customer_id: string;
  transaction_id: string | null;
  customer_edd_id: string | null;
  investigation_number: string;
  status: InvestigationStatus;
  triggered_by: TriggerType;
  triggered_by_admin_id: string | null;
  trigger_reason: string;

  // Checklist sections
  customer_information_review: ChecklistSection;
  employment_verification: EmploymentVerification;
  source_of_wealth: SourceOfWealth;
  source_of_funds: SourceOfFunds;
  transaction_pattern_analysis: TransactionPatternAnalysis;
  additional_information: AdditionalInformation;

  // Outcomes
  investigation_findings: string | null;
  risk_assessment_summary: string | null;
  compliance_recommendation: ComplianceRecommendation | null;

  // Actions
  information_requests: InformationRequest[];
  escalations: Escalation[];

  // Management approval
  requires_management_approval: boolean;
  approved_by_management: boolean;
  management_approver_id: string | null;
  management_approved_at: string | null;

  // Tracking
  assigned_to: string | null;
  primary_investigator_id: string | null;
  reviewed_by: string | null;
  opened_at: string;
  completed_at: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

// Investigation with customer details (for admin UI)
export interface EDDInvestigationWithCustomer extends EDDInvestigation {
  customer_name: string;
  customer_email: string;
  customer_risk_level: string;
  customer_is_pep: boolean;
  transaction_amount_aud?: number;
}

// Investigation creation payload
export interface CreateInvestigationPayload {
  customer_id: string;
  transaction_id?: string;
  trigger_reason: string;
  triggered_by: TriggerType;
  triggered_by_admin_id?: string;
}

// Investigation update payload
export interface UpdateInvestigationPayload {
  section_name: keyof Pick<EDDInvestigation,
    'customer_information_review' |
    'employment_verification' |
    'source_of_wealth' |
    'source_of_funds' |
    'transaction_pattern_analysis' |
    'additional_information'
  >;
  section_data: Partial<ChecklistSection | EmploymentVerification | SourceOfWealth | SourceOfFunds | TransactionPatternAnalysis | AdditionalInformation>;
}

// Investigation completion payload
export interface CompleteInvestigationPayload {
  investigation_findings: string;
  risk_assessment_summary: string;
  compliance_recommendation: ComplianceRecommendation;
}

// Information request payload
export interface RequestInformationPayload {
  items: string[];
  deadline?: string;
}
