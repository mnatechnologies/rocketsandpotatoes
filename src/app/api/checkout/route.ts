import { NextRequest, NextResponse } from 'next/server';
import {  calculateRiskScore, getRiskLevel } from '@/lib/compliance/risk-scoring';
import {getComplianceRequirements} from "@/lib/compliance/thresholds";
import {detectStructuring} from "@/lib/compliance/structuring-detection";
import { createClient } from "@supabase/supabase-js";
import { createLogger } from '@/lib/utils/logger';
// import { createServerSupabase } from "@/lib/supabase/server";
import { screenCustomer } from "@/lib/compliance/screening";

/* eslint-disable */

const logger = createLogger('CHECKOUT_API');

export async function POST(req: NextRequest) {
  logger.log('Checkout validation request received');

    //subject to removal once I actually get createServerSupabase workin with clerk lmao
    const supabase = createClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.SUPABASE_SERVICE_ROLE_KEY!,
                  {
                    auth: {
                      autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
  
  const { customerId, amount, productDetails } = await (req as any).json();
  logger.log('Request data:', { customerId, amount, productDetails });

  try {
    const sanctionsResult = await screenCustomer(customerId);
    if (sanctionsResult.isMatch) {
      // BLOCK TRANSACTION IMMEDIATELY
      logger.log('⛔ Sanctions match detected!', sanctionsResult);

      // Auto-generate SMR
      // await generateSMR({
      //   customerId,
      //   suspicionType: 'sanctions_match',
      //   indicators: sanctionsResult.matches.map(m =>
      //     `Match: ${m.name} (${m.source}) - Score: ${m.matchScore}`
      //   ),
      //   narrative: `Customer matched against ${sanctionsResult.matches[0].source} sanctions list. Reference: ${sanctionsResult.matches[0].referenceNumber}`,
      // });

      return Response.json({
        status: 'blocked',
        reason: 'compliance_review_required',
        message: 'Your transaction requires additional verification. Our compliance team will contact you.',
      }, { status: 403 });
    }
  } catch (error) {
    logger.error('Sanctions screening failed:', error);
    // FAIL SAFE - if screening fails, require manual review
    return Response.json({
      status: 'requires_review',
      reason: 'screening_error',
    });
  } finally {
    logger.log('screening_test', customerId)
  }



  // 1. Check compliance thresholds
  const requirements = await getComplianceRequirements(customerId, amount);
  logger.log('Compliance requirements:', requirements);

  // 2. Get customer data
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError) {
    logger.log('Customer fetch error:', customerError);
  }

  if (!customer) {
    logger.log('Customer not found:', customerId);
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  logger.log('Customer data:', { 
    id: customer.id, 
    verification_status: customer.verification_status,
    risk_level: customer.risk_level 
  });

  // 3. Check if KYC is required but not completed
  if (requirements.requiresKYC && customer.verification_status !== 'verified') {
    logger.log('KYC required but not completed');
    return NextResponse.json({
      status: 'kyc_required',
      message: 'Identity verification required for transactions over $5,000',
      requirements,
    });
  }

  if (requirements.requiresTTR) {
    logger.log('TTR required for transaction over $10,000');
    return NextResponse.json({
      status: 'ttr_required',
      message: 'Threshold Transaction Report required for transactions over $10,000',
      requirements,
      riskScore: 0,
      riskLevel: "undefined",
    });
  }

  // 4. Check for structuring
  const isStructuring = await detectStructuring(customerId, amount);
  logger.log('Structuring detection result:', isStructuring);

  // 5. Calculate risk score
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('id')
    .eq('customer_id', customerId);

  logger.log('Previous transactions count:', previousTransactions?.length || 0);

 // @ts-ignore
  const riskScore = calculateRiskScore({
   transactionAmount: amount,
   customerAge: Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)),
   previousTransactionCount: previousTransactions?.length || 0,
   isInternational: customer?.residential_address?.country !== 'AU',
    // @ts-ignore fuck linting
   hasMultipleRecentTransactions: previousTransactions && previousTransactions.length >= 3,
   unusualPattern: isStructuring,
 });

  const riskLevel = getRiskLevel(riskScore);
  logger.log('Risk assessment:', { riskScore, riskLevel });

  // 6. Flag for manual review if high risk
  const requiresReview = riskLevel === 'high' || customer.risk_level === "high" || isStructuring || requirements.requiresEnhancedDD;
  logger.log('Requires manual review:', requiresReview);

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

  logger.log('Final response:', response);

  return NextResponse.json(response);
}
