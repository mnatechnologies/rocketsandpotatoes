import { NextRequest, NextResponse } from 'next/server';
import {  calculateRiskScore, getRiskLevel } from '@/lib/compliance/risk-scoring';
import {getComplianceRequirements} from "@/lib/compliance/thresholds";
import {detectStructuring} from "@/lib/compliance/structuring-detection";
import { createClient } from "@supabase/supabase-js";
import { createLogger } from '@/lib/utils/logger';
// import { createServerSupabase } from "@/lib/supabase/server";
import { screenCustomer } from "@/lib/compliance/screening";
import { generateSMR } from "@/lib/compliance/smr-generator";
import { sendSanctionsMatchAlert } from "@/lib/email/sendComplianceAlert";
import { fetchFxRate } from '@/lib/metals-api/metalsApi';
import {sendTransactionFlaggedAlert} from "@/lib/email/sendComplianceAlert";


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
  
  const { customerId, amount, currency = 'USD', productDetails, cartItems, sessionId } = await (req as any).json();
  logger.log('Request data:', {
    customerId,
    amount,
    currency,
    sessionId,
    productDetails,
    cartItemsCount: cartItems?.length,
    cartItems: cartItems?.map((item: any) => ({
      productId: item.productId,
      id: item.id,
      quantity: item.quantity,
      price: item.price
    }))
  });

  // ✅ NO CONVERSION - Get locked prices from database (single source of truth)
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: 'Session ID required for price validation' },
      { status: 400 }
    );
  }

  const { data: locks, error: lockError } = await supabase
    .from('price_locks')
    .select('product_id, locked_price_usd, locked_price_aud, fx_rate, currency')
    .eq('session_id', sessionId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());

  if (lockError) {
    logger.error('Error fetching price locks:', lockError);
    return NextResponse.json(
      { success: false, error: 'Failed to validate prices' },
      { status: 500 }
    );
  }

  if (!locks || locks.length === 0) {
    logger.log('No active price locks found for session:', sessionId);
    return NextResponse.json(
      { success: false, error: 'Price locks expired. Please refresh and try again.' },
      { status: 400 }
    );
  }

  logger.log('📦 Found price locks:', locks.map(lock => ({
    product_id: lock.product_id,
    price_usd: lock.locked_price_usd,
    price_aud: lock.locked_price_aud,
    fx_rate: lock.fx_rate
  })));

  // ✅ Calculate amounts in BOTH currencies using LOCKED prices (single source of truth)
  logger.log('🧮 Calculating totals from locks...');

  const amountInUSD = locks.reduce((sum, lock) => {
    const item = cartItems?.find((i: any) => i.productId === lock.product_id);
    const quantity = item?.quantity || 1;

    logger.log(`  Product ${lock.product_id.substring(0, 8)}...: ${lock.locked_price_usd} USD × ${quantity} = ${(lock.locked_price_usd * quantity).toFixed(2)} USD ${item ? '✓' : '⚠️ (no cart item)'}`);

    if (!item) {
      logger.warn(`⚠️ No cart item found for locked product ${lock.product_id}, defaulting quantity to 1`);
    }

    return sum + (lock.locked_price_usd * quantity);
  }, 0);

  const amountInAUD = locks.reduce((sum, lock) => {
    const item = cartItems?.find((i: any) => i.productId === lock.product_id);
    const quantity = item?.quantity || 1;
    return sum + (lock.locked_price_aud * quantity);
  }, 0);

  const fxRate = locks[0].fx_rate;

  logger.log('✅ Using locked prices (NO conversion):', {
    amountInUSD: amountInUSD.toFixed(2),
    amountInAUD: amountInAUD.toFixed(2),
    fxRate,
    locksCount: locks.length,
    submittedAmount: amount,
    submittedCurrency: currency,
  });

  // ⚠️ Warn if submitted amount doesn't match calculated amount
  const calculatedAmount = currency === 'AUD' ? amountInAUD : amountInUSD;
  const difference = Math.abs(amount - calculatedAmount);
  if (difference > 1) {
    logger.warn(`⚠️ PRICE MISMATCH: Submitted ${currency} ${amount.toFixed(2)} but calculated ${calculatedAmount.toFixed(2)} (diff: ${difference.toFixed(2)})`);
  }

  try {
    const sanctionsResult = await screenCustomer(customerId);
    if (sanctionsResult.isMatch) {
      // BLOCK TRANSACTION IMMEDIATELY
      logger.log('⛔ Sanctions match detected!', sanctionsResult);

      await generateSMR({
        customerId,
        suspicionType: 'sanctions_match',
        indicators: sanctionsResult.matches.map(m =>
          `Match: ${m.name} (${m.source}) - Score: ${m.matchScore}`
        ),
        narrative: `Customer matched against ${sanctionsResult.matches[0].source} sanctions list. Reference: ${sanctionsResult.matches[0].referenceNumber}`,
      });

      await supabase.from('audit_logs').insert({
        action_type: 'sanctions_match_blocked',
        entity_type: 'customer',
        entity_id: customerId,
        description: 'Transaction blocked due to sanctions match',
        metadata: {
          amount,
          currency,
          amountInAUD,
          matches: sanctionsResult.matches,
        },
        created_at: new Date().toISOString(),
      });

      // Send compliance alert
      await sendSanctionsMatchAlert({
        customerId,
        customerName: sanctionsResult.screenedName,
        matchedEntity: sanctionsResult.matches[0].name,
        matchScore: sanctionsResult.matches[0].matchScore,
        source: sanctionsResult.matches[0].source,
        transactionAmount: amount,
      });

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



  // 1. Check compliance thresholds (using AUD amount for Australian regulations)
  const requirements = await getComplianceRequirements(customerId, amountInAUD);
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


  // 4. Check for structuring (using AUD amount for threshold comparison)
  const isStructuring = await detectStructuring(customerId, amountInAUD);
  logger.log('Structuring detection result:', isStructuring);

  // 5. Calculate risk score (only count succeeded transactions)
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('id')
    .eq('customer_id', customerId)
    .eq('payment_status', 'succeeded');

  logger.log('Previous succeeded transactions count:', previousTransactions?.length || 0);

 // @ts-ignore
  const riskScore = calculateRiskScore({
   transactionAmount: amountInAUD,
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

  if (requiresReview) {
    const flagReasons = [];
    if (isStructuring) flagReasons.push('Potential structuring detected');
    if (riskLevel === 'high') flagReasons.push('High risk score');
    if (customer.risk_level === 'high') flagReasons.push('High risk customer');
    if (requirements.requiresEnhancedDD) flagReasons.push('Enhanced due diligence required');
    if (previousTransactions && previousTransactions.length >= 3) {
      flagReasons.push('Multiple recent transactions detected');
    }

    logger.log('🚩 Creating flagged transaction record:', flagReasons);

    const { data: flaggedTransaction, error: flagError } = await supabase
      .from('transactions')
      .insert({
        customer_id: customerId,
        transaction_type: 'purchase',
        // ✅ Always store USD as base amount (from locked prices)
        amount: amountInUSD,
        currency: 'USD',  // Base currency
        amount_aud: amountInAUD,  // For compliance
        product_type: productDetails?.name || 'Multiple items',
        product_details: {
          items: cartItems || [productDetails],
          mainProduct: productDetails,
          displayCurrency: currency,  // What user saw
          lockedFxRate: fxRate,
        },
        payment_status: 'pending_review',
        flagged_for_review: true,
        review_status: 'pending',
        review_notes: flagReasons.join('; '),
        requires_kyc: requirements.requiresKYC,
        requires_ttr: requirements.requiresTTR,
        requires_enhanced_dd: requirements.requiresEnhancedDD,
        // ✅ Store the reason for flagging
        metadata: {
          flagReasons,
          riskScore,
          riskLevel,
          isStructuring,
          previousTransactionCount: previousTransactions?.length || 0,
          amountInAUD,
          fxRate: fxRate
        },
      })
      .select()
      .single();

    if (flagError) {
      logger.error('Failed to create flagged transaction:', flagError);
    } else {
      logger.log('✅ Flagged transaction created:', flaggedTransaction.id);

      // Create audit log
      await supabase.from('audit_logs').insert({
        action_type: 'transaction_flagged',
        entity_type: 'transaction',
        entity_id: flaggedTransaction.id,
        description: `Transaction flagged for review: ${flagReasons.join(', ')}`,
        metadata: {
          customer_id: customerId,
          amount,
          currency,
          amountInAUD,
          flagReasons,
          riskScore,
          riskLevel,
        },
        created_at: new Date().toISOString(),
      });

      if (flaggedTransaction && customer) {
        await sendTransactionFlaggedAlert({
          transactionId: flaggedTransaction.id,
          customerId: customerId,
          customerName: `${customer.first_name} ${customer.last_name}`,
          transactionAmount: amountInAUD,
          flagReason: flagReasons.join(', '),
        });
      }

    }
  }

  const response = {
    status: requiresReview ? 'requires_review' : 'approved',
    requirements,
    riskScore,
    riskLevel,
    flags: {
      structuring: isStructuring,
      highValue: requirements.requiresEnhancedDD,
      highRisk: riskLevel === 'high',
      multipleRecentTransactions: previousTransactions && previousTransactions.length >= 3,
    },
    message: requiresReview
      ? 'Transaction flagged for manual review'
      : 'Transaction approved',
  };

  logger.log('Final response:', response);

  return NextResponse.json(response);
}
