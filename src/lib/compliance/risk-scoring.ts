interface RiskFactors {
  transactionAmount: number;
  customerAge: number; //days
  previousTransactionCount: number;
  isInternational: boolean;
  hasMultipleRecentTransactions: boolean;
  unusualPattern: boolean;
  paymentNameMismatch?: boolean;
  mismatchSeverity?: 'none' | 'low' | 'medium' | 'high';
  hasKYCVerification?: boolean;
}

export function calculateRiskScore(factors: RiskFactors) : number {
  let score = 0;

  if (factors.transactionAmount > 100000) score+= 30;
  else if (factors.transactionAmount > 50000) score+= 20;
  else if (factors.transactionAmount > 20000) score+= 10;

  if (factors.customerAge < 7) score+= 15;
  else if (factors.customerAge < 30) score+= 10;

  if (factors.hasMultipleRecentTransactions) score += 20;

  if (factors.isInternational) score+= 15;

  if (factors.unusualPattern) score+= 25;

  if (factors.paymentNameMismatch) {
    const severity = factors.mismatchSeverity || 'medium';
    const hasKYC = factors.hasKYCVerification || false;

    // Higher risk if KYC verified (means using card that doesn't match verified ID)
    if (severity === 'high') {
      score += hasKYC ? 30 : 20;  // More serious if KYC verified
    } else if (severity === 'medium') {
      score += hasKYC ? 20 : 12;
    } else if (severity === 'low') {
      score += hasKYC ? 8 : 5;
    }
  }

  return Math.min(score, 100);

}

export function getRiskLevel(score: number) : 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}