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
import { createEDDInvestigation } from '@/lib/compliance/edd-service';



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

    // SKIP locks for products not in current cart (old locks from previous sessions)
    if (!item) {
      logger.warn(`⚠️ Skipping lock for product ${lock.product_id} - not in current cart`);
      return sum;
    }

    const quantity = item.quantity;
    logger.log(`  Product ${lock.product_id.substring(0, 8)}...: ${lock.locked_price_usd} USD × ${quantity} = ${(lock.locked_price_usd * quantity).toFixed(2)} USD ✓`);

    return sum + (lock.locked_price_usd * quantity);
  }, 0);

  const amountInAUD = locks.reduce((sum, lock) => {
    const item = cartItems?.find((i: any) => i.productId === lock.product_id);

    // SKIP locks for products not in current cart
    if (!item) {
      return sum;
    }

    const quantity = item.quantity;
    return sum + (lock.locked_price_aud * quantity);
  }, 0);

  const fxRate = locks[0].fx_rate;
  const calculatedAmount = currency === 'AUD' ? amountInAUD : amountInUSD;

  logger.log('✅ Using locked prices (NO conversion):', {
    amountInUSD: amountInUSD.toFixed(2),
    amountInAUD: amountInAUD.toFixed(2),
    fxRate,
    locksCount: locks.length,
    submittedAmount: calculatedAmount,
    submittedCurrency: currency,
  });

  // ⚠️ Warn if submitted amount doesn't match calculated amount
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

  // 3. EDD AUTO-TRIGGER & BLOCKING CHECKS (MUST HAPPEN BEFORE TRANSACTION CREATION)
  // Calculate cumulative transaction total to check $50K AUD threshold
  const { data: previousSuccessfulTransactions } = await supabase
    .from('transactions')
    .select('amount_aud')
    .eq('customer_id', customerId)
    .eq('payment_status', 'succeeded');

  const cumulativeTotal = (previousSuccessfulTransactions || []).reduce(
    (sum, tx) => sum + parseFloat(tx.amount_aud.toString()),
    0
  ) + amountInAUD;

  logger.log('Cumulative transaction total (AUD):', cumulativeTotal);

  // // Auto-trigger EDD investigation at $50K threshold
  // if (cumulativeTotal >= 50000 && !customer.requires_enhanced_dd) {
  //   logger.log('🚨 $50K threshold crossed - auto-triggering EDD investigation');
  //
  //   // Check if an active investigation already exists
  //   const { data: existingInvestigation } = await supabase
  //     .from('edd_investigations')
  //     .select('id, investigation_number')
  //     .eq('customer_id', customerId)
  //     .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
  //     .single();
  //
  //   if (!existingInvestigation) {
  //     // Create new investigation
  //     const { data: newInvestigation, error: investigationError } = await supabase
  //       .from('edd_investigations')
  //       .insert({
  //         customer_id: customerId,
  //         triggered_by: 'system',
  //         trigger_reason: `Automatic EDD trigger: Cumulative transactions reached $${cumulativeTotal.toFixed(2)} AUD (threshold: $50,000 AUD)`,
  //         status: 'open',
  //       })
  //       .select()
  //       .single();
  //
  //     if (!investigationError && newInvestigation) {
  //       // Update customer flags
  //       await supabase
  //         .from('customers')
  //         .update({
  //           requires_enhanced_dd: true,
  //           edd_completed: false,
  //           current_investigation_id: newInvestigation.id,
  //         })
  //         .eq('id', customerId);
  //
  //       // Log to audit
  //       await supabase.from('audit_logs').insert({
  //         action_type: 'edd_investigation_created',
  //         entity_type: 'edd_investigation',
  //         entity_id: newInvestigation.id,
  //         description: 'EDD investigation auto-triggered at $50K threshold',
  //         metadata: {
  //           customer_id: customerId,
  //           cumulative_total_aud: cumulativeTotal,
  //           investigation_number: newInvestigation.investigation_number,
  //           triggered_by: 'system',
  //         },
  //       });
  //
  //       logger.log('✅ EDD investigation created:', newInvestigation.investigation_number);
  //
  //       // Note: Email will be sent later when we have email functions created
  //
  //     }
  //   }
  //
  //   // Reload customer to get updated EDD flags
  //   const { data: updatedCustomer } = await supabase
  //     .from('customers')
  //     .select('*')
  //     .eq('id', customerId)
  //     .single();
  //
  //   if (updatedCustomer) {
  //     Object.assign(customer, updatedCustomer);
  //   }
  // }

  if (cumulativeTotal >= 50000 && !customer.requires_enhanced_dd) {
    logger.log('🚨 $50K threshold crossed - auto-triggering EDD investigation');

    // Check if an active investigation already exists
    const { data: existingInvestigation } = await supabase
        .from('edd_investigations')
        .select('id, investigation_number, status')
        .eq('customer_id', customerId)
        .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
        .single();

    if (!existingInvestigation) {
      // Create new investigation using shared service
      const result = await createEDDInvestigation({
        customerId,
        triggerReason: `Automatic EDD trigger: Cumulative transactions reached $${cumulativeTotal.toFixed(2)} AUD (threshold: $50,000 AUD)`,
        triggeredBy: 'system',
      });

      if (result.success) {
        logger.log('✅ EDD investigation created:', result.investigation.investigation_number);
        logger.log('✅ EDD investigation created - allowing checkout to proceed to show EDD form');
      } else {
        logger.error('Failed to create EDD investigation:', result.error);
        // Continue anyway - don't block the transaction due to investigation creation failure
      }
    }

    // Reload customer to get updated EDD flags
    const { data: updatedCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

    if (updatedCustomer) {
      Object.assign(customer, updatedCustomer);
    }
  }

  // 🔒 CRITICAL: Block if customer relationship is blocked (BEFORE all other checks)
  if (customer.monitoring_level === 'blocked') {
    logger.log('❌ Transaction blocked: Customer relationship blocked');

    await supabase.from('audit_logs').insert({
      action_type: 'transaction_blocked_relationship',
      entity_type: 'customer',
      entity_id: customerId,
      description: 'Transaction blocked: Customer relationship status is blocked',
      metadata: { amount_aud: amountInAUD },
    });

    return NextResponse.json({
      status: 'blocked',
      reason: 'account_blocked',
      message: 'Your account has been blocked. Please contact our compliance team for further information.',
    }, { status: 403 });
  }

  // 4. COMPLIANCE HIERARCHY: Check KYC first (must complete before SOF and EDD)
  if (requirements.requiresKYC && customer.verification_status !== 'verified') {
    logger.log('KYC required but not completed');
    return NextResponse.json({
      status: 'kyc_required',
      message: 'Identity verification required for transactions over $5,000',
      requirements,
    });
  }

  // 5. Check Source of Funds for $10K+ transactions (after KYC, before EDD)
  if (requirements.requiresTTR) {
    logger.log('Source of Funds required but not provided');
    return NextResponse.json({
      status: 'sof_required',
      message: 'Source of funds declaration required for transactions over $10,000 AUD',
      requirements,
      amountInAUD,
    });
  }
  let showEDDForm = false;

  // 6. Check if EDD investigation is under review (customer already submitted, waiting for admin)
  if (customer.requires_enhanced_dd && !customer.edd_completed) {
    const { data: activeInvestigation } = await supabase
      .from('edd_investigations')
      .select('id, investigation_number, status, customer_edd_id')
      .eq('customer_id', customerId)
      .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    // Only block if customer has already submitted EDD (status = under_review or later)
    // If status is 'open' or 'awaiting_customer_info', let them proceed to checkout
    // where they'll be shown the EDD form
    if (activeInvestigation && (activeInvestigation.status === 'under_review' || activeInvestigation.status === 'escalated')) {
      logger.log('❌ Transaction blocked: EDD investigation under review/escalated');

      await supabase.from('audit_logs').insert({
        action_type: 'transaction_blocked_edd',
        entity_type: 'customer',
        entity_id: customerId,
        description: 'Transaction blocked: EDD investigation under review by admin',
        metadata: {
          amount_aud: amountInAUD,
          investigation_id: activeInvestigation.id,
          investigation_number: activeInvestigation.investigation_number,
          investigation_status: activeInvestigation.status,
        },
      });

      return NextResponse.json({
        status: 'blocked',
        reason: 'edd_investigation_required',
        message: 'Your Enhanced Due Diligence information has been submitted and is under review. Your account will remain blocked until the review is complete.',
        investigation: {
          number: activeInvestigation.investigation_number,
          status: activeInvestigation.status,
        },
      }, { status: 403 });
    }

    // If investigation is 'open' or 'awaiting_customer_info', don't block
    // Let them proceed - CheckoutFlow will show EDD form in the payment step
    if (activeInvestigation && (activeInvestigation.status === 'open' || activeInvestigation.status === 'awaiting_customer_info')) {
      logger.log('EDD investigation exists but not yet submitted - requiring EDD form');

      // Override requirements to ensure frontend shows EDD form
      showEDDForm = true;

    }
  }


  // 5. Check for structuring (using AUD amount for threshold comparison)
  const isStructuring = await detectStructuring(customerId, amountInAUD);
  logger.log('Structuring detection result:', isStructuring);

  // 6. Calculate risk score (only count succeeded transactions)
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('id')
    .eq('customer_id', customerId)
    .eq('payment_status', 'succeeded');

  logger.log('Previous succeeded transactions count:', previousTransactions?.length || 0);

  const { data: pastMismatches } = await supabase
      .from('transactions')
      .select('payment_name_mismatch_severity, created_at')
      .eq('customer_id', customerId)
      .eq('payment_name_mismatch', true)
      .eq('payment_status', 'succeeded')
      .order('created_at', { ascending: false });

  const hasPastMismatches = (pastMismatches?.length ?? 0) > 0;
  const hasHighSeverityMismatch = pastMismatches?.some(m => m.payment_name_mismatch_severity === 'high') ?? false;
  const mismatchCount = pastMismatches?.length || 0;

  if (hasPastMismatches) {
    logger.log(`⚠️ Customer has ${mismatchCount} previous payment name mismatch(es)`, {
      highSeverity: hasHighSeverityMismatch,
      severities: pastMismatches?.map(m => m.payment_name_mismatch_severity),
    });
  }
  // @ts-ignore
  const riskScore = calculateRiskScore({
    transactionAmount: amountInAUD,
    customerAge: Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    previousTransactionCount: previousTransactions?.length || 0,
    isInternational: customer?.residential_address?.country !== 'AU',
    // @ts-ignore
    hasMultipleRecentTransactions: previousTransactions && previousTransactions.length >= 3,
    unusualPattern: isStructuring,
    paymentNameMismatch: hasPastMismatches ?? false,  // ✅ ADD
    mismatchSeverity: hasHighSeverityMismatch ? 'high' : hasPastMismatches ? 'medium' : 'none',  // ✅ ADD
    hasKYCVerification: customer.verification_status === 'verified',  // ✅ ADD
  });


  const riskLevel = getRiskLevel(riskScore);
  logger.log('Risk assessment:', { riskScore, riskLevel });

  // 7. Flag for manual review if high risk (only if not already blocked by EDD)
  const requiresReview = riskLevel === 'high' || customer.risk_level === "high" || isStructuring || requirements.requiresEnhancedDD;
  logger.log('Requires manual review:', requiresReview);

  if (requiresReview) {
    // 🔒 Check if customer already has a pending transaction under review
    const { data: existingPendingTx } = await supabase
      .from('transactions')
      .select('id, created_at')
      .eq('customer_id', customerId)
      .eq('payment_status', 'pending_review')
      .eq('flagged_for_review', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingPendingTx) {
      logger.log('❌ Customer already has pending transaction under review:', existingPendingTx.id);

      await supabase.from('audit_logs').insert({
        action_type: 'transaction_blocked_pending_review',
        entity_type: 'customer',
        entity_id: customerId,
        description: 'Transaction blocked: Customer has pending transaction under review',
        metadata: {
          amount_aud: amountInAUD,
          existing_transaction_id: existingPendingTx.id,
        },
      });

      return NextResponse.json({
        status: 'blocked',
        reason: 'pending_review',
        message: 'You have a transaction pending review. Our compliance team will contact you once the review is complete. Please do not attempt additional transactions at this time.',
        existingTransaction: {
          id: existingPendingTx.id,
          createdAt: existingPendingTx.created_at,
        },
      }, { status: 403 });
    }

    const flagReasons = [];
    if (isStructuring) flagReasons.push('Potential structuring detected');
    if (riskLevel === 'high') flagReasons.push('High risk score');
    if (customer.risk_level === 'high') flagReasons.push('High risk customer');
    if (requirements.requiresEnhancedDD) flagReasons.push('Enhanced due diligence required');
    if (previousTransactions && previousTransactions.length >= 3) {
      flagReasons.push('Multiple recent transactions detected');
    }
    if (hasHighSeverityMismatch) {
      flagReasons.push('Previous high-severity payment name mismatch detected');
    }
    if (mismatchCount >= 2) {
      flagReasons.push(`Multiple payment name mismatches (${mismatchCount} previous incidents)`);
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
      return NextResponse.json(
          {
            error: 'Failed to process transaction. Please contact support.',
            details: flagError.message
          },
          { status: 500 }
      );
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
    requirements: {
      ...requirements,
      showEDDForm,
    },
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
