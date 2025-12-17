

import {TEST_SCENARIOS} from "../test/test-config";
import {createLogger} from "../lib/utils/logger";

const logger = createLogger('TESTING')
async function runDryTest(scenarioName: keyof typeof TEST_SCENARIOS) {
  logger.log(`\n${'='.repeat(60)}`);
  logger.log(`Running: ${scenarioName}`);
  logger.log('='.repeat(60));

  const scenario = TEST_SCENARIOS[scenarioName];

  logger.log('\n📋 Scenario Details:');
  logger.log(`  Customer ID: ${scenario.customerId}`);
  logger.log(`  Amount: $${scenario.amount.toLocaleString()}`);
  logger.log(`  Product: ${scenario.productDetails.name}`);
  logger.log(`  Expected Flow: ${scenario.expectedFlow}`);

  try {
    // Step 1: Validation
    logger.log('\n🔍 Step 1: Validating transaction...');
    const validationResponse = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: scenario.customerId,
        amount: scenario.amount,
        productDetails: scenario.productDetails
      })
    });

    const validationResult = await validationResponse.json();
    logger.log('\n✅ Validation Result:');
    logger.log(`  Status: ${validationResult.status}`);
    logger.log(`  Risk Level: ${validationResult.riskLevel}`);
    logger.log(`  Risk Score: ${validationResult.riskScore}`);
    logger.log(`  Requires KYC: ${validationResult.requirements?.requiresKYC}`);

    if (validationResult.flags) {
      logger.log('\n⚠️  Flags:');
      Object.entries(validationResult.flags).forEach(([key, value]) => {
        if (value) logger.log(`    - ${key}`);
      });
    }

    // Step 2: Payment Intent (if approved)
    if (validationResult.status === 'approved') {
      logger.log('\n💳 Step 2: Creating payment intent...');
      const paymentResponse = await fetch('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: scenario.amount,
          currency: 'aud',
          customerId: scenario.customerId,
        })
      });

      const paymentResult = await paymentResponse.json();
      logger.log('✅ Payment Intent Created:');
      logger.log(`  Intent ID: ${paymentResult.paymentIntentId}`);
      logger.log(`  Client Secret: ${paymentResult.clientSecret?.substring(0, 20)}...`);
    }

    // Verify expected flow
    const actualFlow =
      validationResult.status === 'kyc_required' ? 'kyc' :
        validationResult.status === 'ttr_required' ? 'ttr' :
          validationResult.status === 'requires_review' ? 'review' :
            'payment';

    logger.log('\n🎯 Flow Verification:');
    logger.log(`  Expected: ${scenario.expectedFlow}`);
    logger.log(`  Actual: ${actualFlow}`);
    logger.log(`  Match: ${actualFlow === scenario.expectedFlow ? '✅' : '❌'}`);

  } catch (error) {
     logger.error('\n❌ Error:', error);
  }

  logger.log('\n' + '='.repeat(60) + '\n');
}

async function runAllDryTests() {
  logger.log('\n🚀 Starting Checkout Flow Dry Runs\n');

  for (const scenarioName of Object.keys(TEST_SCENARIOS) as Array<keyof typeof TEST_SCENARIOS>) {
    await runDryTest(scenarioName);
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logger.log('✅ All dry runs complete!\n');
}

// Run if called directly
if (require.main === module) {
runAllDryTests().catch( logger.error);
}

export { runDryTest, runAllDryTests };