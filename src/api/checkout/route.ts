import { NextRequest, NextResponse } from 'next/server';
import {  calculateRiskScore, getRiskLevel } from '@/lib/compliance/risk-scoring';
import {getComplianceRequirements} from "@/lib/compliance/thresholds";
import {detectStructuring} from "@/lib/compliance/structuring-detection";
import { createServerSupabase } from "@/lib/supabase/server";
/* eslint-disable */

export async function POST(req: NextRequest) {
  const { customerId, amount  } = await (req as any).json();
  const supabase = createServerSupabase();

  // 1. Check compliance thresholds
  const requirements = getComplianceRequirements(amount);

  // 2. Get customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  // 3. Check if KYC is required but not completed
  if (requirements.requiresKYC && customer.verification_status !== 'verified') {
    return NextResponse.json({
      status: 'kyc_required',
      message: 'Identity verification required for transactions over $5,000',
      requirements,
    });
  }


  const isStructuring = await detectStructuring(customerId, amount);

  // Calculate risk score
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('id')
    .eq('customer_id', customerId);

 // @ts-ignore
  const  riskScore = calculateRiskScore({
   transactionAmount: amount,
   customerAge: Math.floor((Date.now() - new Date(customerId.created_at).getTime()) / (1000 * 60 * 60 * 24)),
   previousTransactionCount: previousTransactions?.length || 0,
   isInternational: customerId?.residential_address?.country !== 'AU',
    // @ts-ignore
   hasMultipleRecentTransactions: previousTransactions && previousTransactions.length >= 3,
   unusualPattern: isStructuring,
 });

  const riskLevel = getRiskLevel(riskScore);

  // 6. Flag for manual review if high risk
  const requiresReview = riskLevel === 'high' || isStructuring || requirements.requiresEnhancedDD;

  return NextResponse.json({
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
  });
}