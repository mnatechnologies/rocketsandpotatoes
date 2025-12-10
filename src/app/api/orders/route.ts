
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
    } = body;

    logger.log('Order data:', { customerId, amount, currency, productCount: cartItems?.length });

    // Validate required fields
    if (!customerId || !amount || !stripePaymentIntentId) {
      logger.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: customerId, amount, stripePaymentIntentId' },
        { status: 400 }
      );
    }

    // ✅ Convert to AUD for compliance checks (Australian regulations require AUD)
    let amountInAUD = amount;
    let fxRate = 1;

    if (currency === 'USD') {
      try {
        const fxResult = await fetchFxRate('USD', 'AUD');
        fxRate = fxResult.rate;
        amountInAUD = amount * fxRate;
        logger.log(`💱 Converted ${amount} USD to ${amountInAUD.toFixed(2)} AUD (rate: ${fxRate})`);
      } catch (error) {
        logger.error('Failed to fetch FX rate, using fallback:', error);
        // Fallback rate if API fails
        fxRate = 1.57;
        amountInAUD = amount * fxRate;
        logger.log(`Using fallback rate: ${amount} USD = ${amountInAUD.toFixed(2)} AUD`);
      }
    }

    logger.log('💰 Amounts:', {
      original: amount,
      currency,
      amountInAUD: amountInAUD.toFixed(2),
      fxRate
    });

    // Verify customer belongs to authenticated user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, clerk_user_id, source_of_funds, occupation, source_of_funds_declared_at')
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


    // ✅ Check source of funds for $10K+ AUD transactions
    let sourceOfFundsMissing = false;
    if (requirements.requiresTTR) {
      if (!customer.source_of_funds || !customer.occupation) {
        logger.log('⚠️ Source of funds missing for $10K+ AUD transaction');
        sourceOfFundsMissing = true;
      } else {
        logger.log('✅ Source of funds verified:', {
          source: customer.source_of_funds,
          occupation: customer.occupation,
        });
      }
    }

    // Create transaction record
    const transactionData = {
      customer_id: customerId,
      transaction_type: 'purchase',
      amount: amount, // Store original amount
      currency: currency, // Store original currency
      amount_aud: amountInAUD, // ✅ Store AUD equivalent for compliance
      product_type: productDetails?.name || 'Multiple items',
      product_details: {
        items: cartItems || [productDetails],
        mainProduct: productDetails,
        currency: currency,
        amountInAUD: amountInAUD,
        fxRate: fxRate,
      },
      stripe_payment_intent_id: stripePaymentIntentId,
      payment_method: paymentMethod,
      payment_status: 'succeeded',
      requires_kyc: requirements.requiresKYC,
      requires_ttr: requirements.requiresTTR,
      requires_enhanced_dd: requirements.requiresEnhancedDD,
      source_of_funds_checked: requirements.requiresTTR,
      source_of_funds_check_date: amountInAUD >= 10000 ? new Date().toISOString() : null,
      flagged_for_review: sourceOfFundsMissing,
      review_status: sourceOfFundsMissing ? 'pending' : null,
      review_notes: sourceOfFundsMissing ? 'Missing source of funds declaration for $10K+ AUD transaction' : null,
    };

    logger.log('Creating transaction record');

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      logger.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create order', details: transactionError },
        { status: 500 }
      );
    }

    logger.log('Transaction created successfully:', transaction.id);

    // ✅ Log if source of funds is missing
    if (sourceOfFundsMissing) {
      await supabase.from('audit_logs').insert({
        action_type: 'transaction_flagged_missing_sof',
        entity_type: 'transaction',
        entity_id: transaction.id,
        description: 'Transaction flagged: missing source of funds for $10K+ AUD transaction',
        metadata: {
          customer_id: customerId,
          amount: amount,
          currency: currency,
          amountInAUD: amountInAUD,
          requires_manual_review: true,
        },
        created_at: new Date().toISOString(),
      });

      logger.log('🚩 Transaction flagged for missing source of funds');
    }

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
        });

        logger.log('✅ TTR generated successfully');

      } catch (ttrError: any) {
        logger.error('❌ Failed to generate TTR:', {
          message: ttrError.message,
          stack: ttrError.stack,
        });

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

        logger.log('⚠️ Order created but TTR generation failed - will need manual generation');
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
        // ✅ Convert item prices to display currency if needed
        const emailItems = cartItems.map((item: any) => {
          const itemPrice = currency === 'USD' ? item.price : item.price * fxRate;
          return {
            name: item.name,
            quantity: item.quantity || 1,
            price: itemPrice * (item.quantity || 1),
            weight: item.weight,
            purity: item.purity,
          };
        });

        // ✅ Calculate totals in display currency
        const displaySubtotal = currency === 'USD' ? amount : amount * fxRate;
        const displayTotal = displaySubtotal; // Add tax/shipping if needed

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
          total: displayTotal,
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

    // Log audit event for order creation
    await supabase.from('audit_logs').insert({
      action_type: 'order_created',
      entity_type: 'transaction',
      entity_id: transaction.id,
      description: `Order created for ${currency} ${amount} (${amountInAUD.toFixed(2)} AUD)`,
      metadata: {
        customer_id: customerId,
        amount,
        currency,
        amountInAUD: amountInAUD,
        fxRate: fxRate,
        payment_intent_id: stripePaymentIntentId,
        source_of_funds_checked: amountInAUD >= 10000,
        flagged_for_review: sourceOfFundsMissing,
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
        amount: amount,
        currency: currency,
        amountInAUD: amountInAUD,
        requires_kyc: requirements.requiresKYC,
        requires_ttr: requirements.requiresTTR,
        requires_edd: requirements.requiresEnhancedDD,
        flaggedForReview: sourceOfFundsMissing,
      },
    });

  } catch (error) {
    logger.error('Error in order creation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}