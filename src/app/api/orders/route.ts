
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmation';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateTTR } from '@/lib/compliance/ttr-generator';
import { fetchFxRate } from '@/lib/metals-api/metalsApi';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { getComplianceRequirements } from '@/lib/compliance/thresholds';


const logger = createLogger('CREATE_ORDER_API');

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

export async function POST(req: NextRequest) {
  logger.log('Order creation request received');

  try {
    const { userId } = await auth();

    if (!userId) {
      logger.log('Unauthorized - no userId from Clerk');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('Authenticated user ID:', userId);

    const body = await req.json();
    const {
      customerId,
      amount,
      currency = 'AUD',
      productDetails,
      cartItems,
      stripePaymentIntentId,
      paymentMethod = 'card',
      sessionId,  // ✅ Need sessionId to get locked prices
    } = body;

    logger.log('Order data:', { customerId, amount, currency, sessionId, productCount: cartItems?.length });

    // Validate required fields
    if (!customerId || !amount || !stripePaymentIntentId) {
      logger.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: customerId, amount, stripePaymentIntentId' },
        { status: 400 }
      );
    }

    // ✅ NO CONVERSION - Get locked prices from database (single source of truth)
    let amountInUSD = amount;
    let amountInAUD = amount;
    let fxRate: number;

    if (sessionId) {
      const { data: locks, error: lockError } = await supabase
        .from('price_locks')
        .select('product_id, locked_price_usd, locked_price_aud, fx_rate, currency')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      if (lockError) {
        logger.error('Error fetching price locks:', lockError);
      }

      if (locks && locks.length > 0) {
        // ✅ Calculate from locked prices (no conversion needed!)
        amountInUSD = locks.reduce((sum, lock) => {
          const item = cartItems?.find((i: any) => i.productId === lock.product_id);
          const quantity = item?.quantity || 1;
          return sum + (lock.locked_price_usd * quantity);
        }, 0);

        amountInAUD = locks.reduce((sum, lock) => {
          const item = cartItems?.find((i: any) => i.productId === lock.product_id);
          const quantity = item?.quantity || 1;
          return sum + (lock.locked_price_aud * quantity);
        }, 0);

        fxRate = locks[0].fx_rate;

        logger.log('✅ Using locked prices (NO conversion):', {
          amountInUSD: amountInUSD.toFixed(2),
          amountInAUD: amountInAUD.toFixed(2),
          fxRate,
          locksCount: locks.length,
        });
      } else {
        logger.warn('⚠️ No locked prices found, fetching live FX rate');
        const fxResult1 = await fetchFxRate('USD', 'AUD');
        fxRate = fxResult1.rate;
        if (currency === 'USD') {
          amountInUSD = amount;
          amountInAUD = amount * fxRate;
        } else {
          amountInAUD = amount;
          amountInUSD = amount / fxRate;
        }
      }
    } else {
      logger.warn('⚠️ No sessionId provided, fetching live FX rate');
      const fxResult2 = await fetchFxRate('USD', 'AUD');
      fxRate = fxResult2.rate;
      if (currency === 'USD') {
        amountInUSD = amount;
        amountInAUD = amount * fxRate;
      } else {
        amountInAUD = amount;
        amountInUSD = amount / fxRate;
      }
    }

    // Verify customer belongs to authenticated user and get source_of_funds
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, clerk_user_id, source_of_funds, occupation, source_of_funds_declared_at, employer, first_name, last_name')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      logger.error('Customer not found:', customerError);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.clerk_user_id !== userId) {
      logger.log('Unauthorized - customer does not belong to user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logger.log('Customer verified:', customer.id);

    // ✅ Determine compliance requirements using AUD amount
    const requirements = await getComplianceRequirements(customerId, amountInAUD);

    logger.log('🔍 Compliance flags (cumulative):', {
      amountInAUD: amountInAUD.toFixed(2),
      cumulativeTotal: requirements.cumulativeTotal,
      newCumulativeTotal: requirements.newCumulativeTotal,
      requiresKYC: requirements.requiresKYC,
      requiresTTR: requirements.requiresTTR,
      requiresEnhancedDD: requirements.requiresEnhancedDD
    });


    // ✅ Check source of funds for $10K+ AUD transactions — BLOCK if missing
    if (requirements.requiresTTR) {
      if (!customer.source_of_funds || !customer.occupation) {
        logger.log('⛔ Source of funds missing for $10K+ AUD transaction — blocking order');

        await supabase.from('audit_logs').insert({
          action_type: 'order_blocked_missing_sof',
          entity_type: 'customer',
          entity_id: customerId,
          description: 'Order blocked: missing source of funds for $10K+ AUD transaction',
          metadata: {
            amount_aud: amountInAUD,
            user_id: userId,
          },
          created_at: new Date().toISOString(),
        });

        return NextResponse.json(
          { error: 'Source of funds declaration is required for transactions over $10,000 AUD. Please complete this before checkout.' },
          { status: 403 }
        );
      } else {
        logger.log('✅ Source of funds verified:', {
          source: customer.source_of_funds,
          occupation: customer.occupation,
        });
      }
    }

    // ✅ Check if transaction already exists (from checkout or admin review)
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .single();

    let transaction;
    let transactionError;

    if (existingTx) {
      // ✅ Update existing transaction to succeeded status
      logger.log('Found existing transaction, updating to succeeded:', existingTx.id);

      const { data: updated, error: updateError} = await supabase
          .from('transactions')
          .update({
            payment_status: 'succeeded',
            payment_method: paymentMethod,
            amount: amountInUSD,
            amount_aud: amountInAUD,
            currency: 'USD',
            product_details: {
              items: cartItems || [productDetails],  // ✅ FIX 1: Use NEW cart items
              mainProduct: productDetails,
              displayCurrency: currency,
              lockedFxRate: fxRate,
              amountInUSD,
              amountInAUD,
              source_of_funds: customer.source_of_funds,
              occupation: customer.occupation,
              employer: customer.employer,
            },
            // ✅ FIX 2: Update compliance flags with CURRENT requirements
            requires_kyc: requirements.requiresKYC,
            requires_ttr: requirements.requiresTTR,
            requires_enhanced_dd: requirements.requiresEnhancedDD,
            flagged_for_review: false,  // Reset since payment succeeded
            review_status: null,  // Clear review status
            review_notes: null,  // Clear old review notes
            metadata: null,  // Clear old metadata (or create new if needed)
            source_of_funds_checked: requirements.requiresTTR,
            source_of_funds_check_date: amountInAUD >= 10000 ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTx.id)
          .select()
          .single();

      transaction = updated;
      transactionError = updateError;
    } else {
      // ✅ Create new transaction (no existing one found)
      logger.log('No existing transaction found, creating new one');

      const transactionData = {
        customer_id: customerId,
        transaction_type: 'purchase',
        amount: amountInUSD,
        currency: 'USD',
        amount_aud: amountInAUD,
        product_type: productDetails?.name || 'Multiple items',
        product_details: {
          items: cartItems || [productDetails],
          mainProduct: productDetails,
          displayCurrency: currency,
          lockedFxRate: fxRate,
          amountInUSD,
          amountInAUD,
          source_of_funds: customer.source_of_funds,
          occupation: customer.occupation,
          employer: customer.employer,
        },
        stripe_payment_intent_id: stripePaymentIntentId,
        payment_method: paymentMethod,
        payment_status: 'succeeded',
        requires_kyc: requirements.requiresKYC,
        requires_ttr: requirements.requiresTTR,
        requires_enhanced_dd: requirements.requiresEnhancedDD,
        source_of_funds_checked: requirements.requiresTTR,
        source_of_funds_check_date: amountInAUD >= 10000 ? new Date().toISOString() : null,
        flagged_for_review: false,
        review_status: null,
        review_notes: null,
      };

      const { data: created, error: createError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      transaction = created;
      transactionError = createError;
    }

    if (transactionError) {
      logger.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    logger.log('Transaction created successfully:', transaction.id);

    // ✅ Generate TTR if required (using AUD amount)
    if (requirements.requiresTTR) {
      try {
        logger.log('🚀 Starting TTR generation for transaction:', transaction.id);
        logger.log('TTR params:', {
          transactionId: transaction.id,
          customerId: customerId,
          amount: amountInAUD,
          originalAmount: amount,
          currency: currency,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        await generateTTR({
          transactionId: transaction.id,
          customerId: customerId,
          amount_aud: amountInAUD,
          transactionDate: transaction.created_at,
          customerName: `${customer.first_name} ${customer.last_name}`, 
        });

        logger.log('✅ TTR generated successfully');

      } catch (ttrError: any) {
        logger.error('❌ Failed to generate TTR:', {
          message: ttrError.message,
          stack: ttrError.stack,
        });

        // Mark transaction as needing TTR retry
        await supabase
          .from('transactions')
          .update({
            review_notes: 'TTR generation failed - requires manual generation or retry',
            flagged_for_review: true,
            review_status: transaction.review_status || 'pending',
          })
          .eq('id', transaction.id);

        await supabase.from('audit_logs').insert({
          action_type: 'ttr_generation_failed',
          entity_type: 'transaction',
          entity_id: transaction.id,
          description: `TTR generation failed: ${ttrError.message}`,
          metadata: {
            error_message: ttrError.message,
            error_stack: ttrError.stack,
            transaction_id: transaction.id,
            customer_id: customerId,
            amount: amountInAUD,
            currency: 'AUD',
          },
          created_at: new Date().toISOString(),
        });

        logger.log('⚠️ Order created but TTR generation failed - transaction flagged for manual review');
      }
    } else {
      logger.log('⏭️ Skipping TTR generation - amount below $10K AUD threshold');
    }

    // Send order confirmation email
    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', customerId)
        .single();

      if (customerData) {
        // ✅ Use prices in display currency (what user selected)
        const displayAmount = currency === 'AUD' ? amountInAUD : amountInUSD;

        const emailItems = cartItems.map((item: any) => {
          // Items should already have prices in the correct currency from cart
          return {
            name: item.name,
            quantity: item.quantity || 1,
            price: item.price * (item.quantity || 1),
            weight: item.weight,
            purity: item.purity,
          };
        });

        // ✅ Use display amount (no conversion needed)
        const displaySubtotal = displayAmount;
        const displayTotal = displayAmount; // Add tax/shipping if needed

        const emailResult = await sendOrderConfirmationEmail({
          orderNumber: transaction.id,
          customerName: `${customerData.first_name} ${customerData.last_name}`,
          customerEmail: customerData.email,
          orderDate: new Date().toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          items: emailItems,
          subtotal: displaySubtotal,
          total: amountInAUD,
          currency: currency,
          paymentMethod: paymentMethod === 'card' ? 'Credit/Debit Card' : paymentMethod,
          requiresKYC: requirements.requiresKYC,
          requiresTTR: requirements.requiresTTR,
        });

        if (emailResult.success) {
          logger.log('Order confirmation email sent to:', customerData.email);
        } else {
          logger.error('Failed to send email:', emailResult.error);
        }
      }
    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
    }

    // ✅ Log audit event with both currencies
    await supabase.from('audit_logs').insert({
      action_type: 'order_created',
      entity_type: 'transaction',
      entity_id: transaction.id,
      description: `Order created: $${amountInUSD.toFixed(2)} USD ($${amountInAUD.toFixed(2)} AUD) - displayed to user in ${currency}`,
      metadata: {
        customer_id: customerId,
        amount_usd: amountInUSD,
        amount_aud: amountInAUD,
        display_currency: currency,
        locked_fx_rate: fxRate,
        payment_intent_id: stripePaymentIntentId,
        source_of_funds_checked: amountInAUD >= 10000,
        flagged_for_review: false,
        requires_ttr: requirements.requiresTTR,
        requires_kyc: requirements.requiresKYC,
        requires_edd: requirements.requiresEnhancedDD,
      },
      created_at: new Date().toISOString(),
    });

    logger.log('✅ Order creation completed successfully');

    return NextResponse.json({
      success: true,
      orderId: transaction.id,
      transaction: {
        id: transaction.id,
        // ✅ Return both amounts for clarity
        amount_usd: amountInUSD,
        amount_aud: amountInAUD,
        display_currency: currency,
        fx_rate: fxRate,
        requires_kyc: requirements.requiresKYC,
        requires_ttr: requirements.requiresTTR,
        requires_edd: requirements.requiresEnhancedDD,
        flaggedForReview: false,
      },
    });

  } catch (error) {
    logger.error('Error in order creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}