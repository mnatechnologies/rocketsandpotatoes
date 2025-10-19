export const complianceThreshold : {readonly enhancedDD: 50000, readonly kycRequired: 5000, readonly ttrRequired: 10000} = {
   enhancedDD: 50000,
   kycRequired: 5000,
   ttrRequired: 10000,
} as const;

export function getComplianceRequirements(amount: number) : {requiresEnhancedDD: boolean, requiresKYC: boolean, requiresTTR: boolean} {
  return {
    requiresEnhancedDD: amount > complianceThreshold.enhancedDD,
    requiresKYC: amount > complianceThreshold.kycRequired,
    requiresTTR: amount > complianceThreshold.ttrRequired,
  }
}