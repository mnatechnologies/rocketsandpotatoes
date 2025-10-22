import { NextRequest, NextResponse } from 'next/server';
import {  calculateRiskScore, getRiskLevel } from '@/lib/compliance/risk-scoring';
import {getComplianceRequirements} from "@/lib/compliance/thresholds";
import {detectStructuring} from "@/lib/compliance/structuring-detection";
import { createServerSupabase } from "@/lib/supabase/server";
/* eslint-disable */

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[CHECKOUT_API]', ...args);
  }
}

export async function POST(req: NextRequest) {
  log('Checkout validation request received');
  
  const { customerId, amount, productDetails } = await (req as any).json();
  log('Request data:', { customerId, amount, productDetails });
  
  const supabase = createServerSupabase();

  // 1. Check compliance thresholds
  const requirements = getComplianceRequirements(amount);
  log('Compliance requirements:', requirements);

  // 2. Get customer data
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError) {
    log('Customer fetch error:', customerError);
  }

  if (!customer) {
    log('Customer not found:', customerId);
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  log('Customer data:', { 
    id: customer.id, 
    verification_status: customer.verification_status,
    risk_level: customer.risk_level 
  });

  // 3. Check if KYC is required but not completed
  if (requirements.requiresKYC && customer.verification_status !== 'verified') {
    log('KYC required but not completed');
    return NextResponse.json({
      status: 'kyc_required',
      message: 'Identity verification required for transactions over $5,000',
      requirements,
    });
  }

  // 4. Check for structuring
  const isStructuring = await detectStructuring(customerId, amount);
  log('Structuring detection result:', isStructuring);

  // 5. Calculate risk score
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('id')
    .eq('customer_id', customerId);

  log('Previous transactions count:', previousTransactions?.length || 0);

 // @ts-ignore
  const riskScore = calculateRiskScore({
   transactionAmount: amount,
   customerAge: Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)),
   previousTransactionCount: previousTransactions?.length || 0,
   isInternational: customer?.residential_address?.country !== 'AU',
    // @ts-ignore
   hasMultipleRecentTransactions: previousTransactions && previousTransactions.length >= 3,
   unusualPattern: isStructuring,
 });

  const riskLevel = getRiskLevel(riskScore);
  log('Risk assessment:', { riskScore, riskLevel });

  // 6. Flag for manual review if high risk
  const requiresReview = riskLevel === 'high' || isStructuring || requirements.requiresEnhancedDD;
  log('Requires manual review:', requiresReview);

  const response = {
    status: requiresReview ? 'requires_review' : 'approved',
    requirements,
    riskScore,
    riskLevel,
    flags: {
      structuring: isStructuring,
      highValue: requirements.requiresEnhancedDD,
      highRisk: riskLevel === 'high',
    },
    message: requiresReview
      ? 'Transaction flagged for manual review'
      : 'Transaction approved',
  };

  log('Final response:', response);

  return NextResponse.json(response);
}
