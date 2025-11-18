// @ts-ignore
import {TEST_SCENARIOS, TEST_CARDS} from "@/test/test-config";

async function runDryTest(scenarioName: keyof typeof TEST_SCENARIOS) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${scenarioName}`);
  console.log('='.repeat(60));

  const scenario = TEST_SCENARIOS[scenarioName];

  console.log('\n📋 Scenario Details:');
  console.log(`  Customer ID: ${scenario.customerId}`);
  console.log(`  Amount: $${scenario.amount.toLocaleString()}`);
  console.log(`  Product: ${scenario.productDetails.name}`);
  console.log(`  Expected Flow: ${scenario.expectedFlow}`);

  try {
    // Step 1: Validation
    console.log('\n🔍 Step 1: Validating transaction...');
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
    console.log('\n✅ Validation Result:');
    console.log(`  Status: ${validationResult.status}`);
    console.log(`  Risk Level: ${validationResult.riskLevel}`);
    console.log(`  Risk Score: ${validationResult.riskScore}`);
    console.log(`  Requires KYC: ${validationResult.requirements?.requiresKYC}`);

    if (validationResult.flags) {
      console.log('\n⚠️  Flags:');
      Object.entries(validationResult.flags).forEach(([key, value]) => {
        if (value) console.log(`    - ${key}`);
      });
    }

    // Step 2: Payment Intent (if approved)
    if (validationResult.status === 'approved') {
      console.log('\n💳 Step 2: Creating payment intent...');
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
      console.log('✅ Payment Intent Created:');
      console.log(`  Intent ID: ${paymentResult.paymentIntentId}`);
      console.log(`  Client Secret: ${paymentResult.clientSecret?.substring(0, 20)}...`);
    }

    // Verify expected flow
    const actualFlow =
      validationResult.status === 'kyc_required' ? 'kyc' :
        validationResult.status === 'ttr_required' ? 'ttr' :
          validationResult.status === 'requires_review' ? 'review' :
            'payment';

    console.log('\n🎯 Flow Verification:');
    console.log(`  Expected: ${scenario.expectedFlow}`);
    console.log(`  Actual: ${actualFlow}`);
    console.log(`  Match: ${actualFlow === scenario.expectedFlow ? '✅' : '❌'}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

async function runAllDryTests() {
  console.log('\n🚀 Starting Checkout Flow Dry Runs\n');

  for (const scenarioName of Object.keys(TEST_SCENARIOS) as Array<keyof typeof TEST_SCENARIOS>) {
    await runDryTest(scenarioName);
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ All dry runs complete!\n');
}

// Run if called directly
if (require.main === module) {
runAllDryTests().catch(console.error);
}

export { runDryTest, runAllDryTests };