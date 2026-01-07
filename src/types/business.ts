export type EntityType = 'company' | 'sole_trader' | 'partnership' | 'trust' | 'smsf';
export type OwnershipType = 'direct' | 'indirect' | 'control_person';
export type AuthorizationType = 'director' | 'secretary' | 'authorized_signatory' | 'delegate';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'requires_review';
export type UBOVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type MonitoringLevel = 'standard' | 'ongoing_review' | 'enhanced' | 'blocked';
export type RiskLevel = 'low' | 'medium' | 'high';
export type EDDStatus = 'pending' | 'under_review' | 'escalated' | 'approved' | 'rejected';
export type AnnualTurnover = 'under_100k' | '100k_500k' | '500k_1m' | '1m_5m' | 'over_5m';

export interface Address {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface BusinessCustomer {
  id: string;
  primary_contact_customer_id: string;

  // Business identification
  abn: string;
  acn?: string;
  business_name: string;
  trading_name?: string;
  entity_type: EntityType;
  business_structure_details?: Record<string, unknown>;

  // ABR verification
  abr_verified: boolean;
  abr_verified_at?: string;
  abr_response?: ABRResponse;
  gst_registered: boolean;
  gst_registered_date?: string;
  entity_status?: string;
  main_business_location?: { state: string; postcode: string };

  // Addresses
  registered_address?: Address;
  principal_address?: Address;

  // Industry
  industry_code?: string;
  industry_description?: string;

  // Compliance
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;

  // Risk
  risk_score: number;
  risk_level: RiskLevel;

  // UBO
  ubo_verification_complete: boolean;
  ubo_verification_date?: string;

  // EDD
  requires_enhanced_dd: boolean;
  edd_completed: boolean;
  edd_completed_at?: string;
  current_investigation_id?: string;
  monitoring_level: MonitoringLevel;

  created_at: string;
  updated_at: string;
}

export interface BeneficialOwner {
  id: string;
  business_customer_id: string;

  // Personal
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  residential_address: Address;

  // Ownership
  ownership_percentage: number;
  ownership_type: OwnershipType;
  role?: string;

  // Verification
  verification_status: UBOVerificationStatus;
  verification_level: string;
  identity_verification_id?: string;

  // Compliance
  is_pep: boolean;
  pep_relationship?: string;
  is_sanctioned: boolean;
  last_screening_at?: string;

  created_at: string;
  updated_at: string;
}

export interface BusinessAuthorizedPerson {
  id: string;
  business_customer_id: string;
  customer_id: string;
  authorization_type: AuthorizationType;
  authorization_document_id?: string;
  transaction_limit_aud?: number;
  requires_co_signatory: boolean;
  is_active: boolean;
  authorized_at: string;
  authorized_by?: string;
  revoked_at?: string;
  revoked_by?: string;
  revocation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ABRResponse {
  abn: string;
  abnStatus: 'Active' | 'Cancelled' | 'Deleted';
  abnStatusFromDate: string;
  entityName: string;
  entityType: string;
  entityTypeCode: string;
  gstRegistered: boolean;
  gstRegisteredDate?: string;
  acn?: string;
  mainBusinessLocation: {
    state: string;
    postcode: string;
  };
  businessNames?: Array<{
    name: string;
    effectiveFrom: string;
  }>;
}

export interface ABRLookupResult {
  success: boolean;
  data?: ABRResponse;
  error?: string;
}

export interface BusinessEDD {
  id: string;
  business_customer_id: string;
  primary_business_activity: string;
  years_in_operation?: number;
  annual_turnover_range?: AnnualTurnover;
  primary_source_of_funds: string;
  source_of_funds_details?: string;
  expected_transaction_frequency: string;
  expected_annual_volume?: string;
  primary_purpose?: string;
  key_suppliers?: Array<{ name: string; country: string; relationship: string }>;
  key_customers?: Array<{ name: string; country: string; relationship: string }>;
  primary_bank?: string;
  banking_history_years?: number;
  status: EDDStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  requires_management_approval: boolean;
  escalated_to_management_at?: string;
  submitted_at: string;
  updated_at: string;
}

// Form types
export interface BusinessRegistrationForm {
  entity_type: EntityType;
  abn: string;
  acn?: string;
  business_name: string;
  trading_name?: string;
  registered_address: Address;
  principal_address?: Address;
}

export interface UBOForm {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  residential_address: Address;
  ownership_percentage: number;
  ownership_type: OwnershipType;
  role: string;
  is_pep: boolean;
  pep_relationship?: string;
}