import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Australian National Bullion',
  description: 'Terms and conditions for purchasing precious metals from Australian National Bullion.',
};

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: December 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
          <p className="text-muted-foreground mb-4">
            These Terms and Conditions (&quot;Terms&quot;) govern your use of the Australian National Bullion website
            and services. By accessing our website or placing an order, you agree to be bound by these Terms.
          </p>
          <p className="text-muted-foreground">
            Australian National Bullion (ABN: XX XXX XXX XXX) is registered with AUSTRAC (Registration Number: 100888166)
            as a bullion dealer under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006.
          </p>
        </section>

        {/* Definitions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Definitions</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <ul className="space-y-3 text-muted-foreground">
              <li><strong className="text-card-foreground">&quot;Bullion&quot;</strong> means gold, silver, platinum, or palladium in the form of bars, ingots, coins, or other authenticated forms.</li>
              <li><strong className="text-card-foreground">&quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;</strong> refers to Australian National Bullion.</li>
              <li><strong className="text-card-foreground">&quot;You&quot;, &quot;Customer&quot;</strong> refers to any person or entity purchasing or seeking to purchase bullion from us.</li>
              <li><strong className="text-card-foreground">&quot;Order&quot;</strong> means a request to purchase bullion through our website.</li>
              <li><strong className="text-card-foreground">&quot;Spot Price&quot;</strong> means the current market price for precious metals.</li>
            </ul>
          </div>
        </section>

        {/* Eligibility */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">3. Eligibility</h2>
          <p className="text-muted-foreground mb-4">To use our services, you must:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Be at least 18 years of age</li>
            <li>Be a resident of Australia or have a valid Australian address</li>
            <li>Have the legal capacity to enter into binding contracts</li>
            <li>Not be a person or entity subject to sanctions under Australian law</li>
            <li>Provide accurate and truthful information during registration and checkout</li>
          </ul>
        </section>

        {/* Pricing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Pricing and Payment</h2>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">4.1 Price Lock System</h3>
              <p className="text-muted-foreground">
                Precious metal prices fluctuate constantly based on global markets. When you add items to your cart,
                we lock the price for a limited time (typically 10 minutes). If the lock expires before checkout
                completion, you will need to refresh for updated pricing.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">4.2 Currency</h3>
              <p className="text-muted-foreground">
                All prices are displayed in Australian Dollars (AUD). Some products may also show USD pricing for
                reference. The AUD amount is the binding price for Australian transactions.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">4.3 Payment Methods</h3>
              <p className="text-muted-foreground mb-4">We accept the following payment methods:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-background px-3 py-1 rounded border border-border text-sm text-foreground">Visa</span>
                <span className="bg-background px-3 py-1 rounded border border-border text-sm text-foreground">Mastercard</span>
                <span className="bg-background px-3 py-1 rounded border border-border text-sm text-foreground">American Express</span>
                <span className="bg-background px-3 py-1 rounded border border-border text-sm text-foreground">Bank Transfer</span>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-muted-foreground text-sm">
                  <strong className="text-foreground">Important:</strong> We do not accept cash payments. This policy is in accordance with
                  our AML/CTF risk management procedures.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">4.4 Payment Processing</h3>
              <p className="text-muted-foreground">
                All card payments are securely processed through Stripe, a PCI-DSS compliant payment processor.
                We do not store your full card details on our servers.
              </p>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">5. Regulatory Compliance</h2>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">5.1 Identity Verification (KYC)</h3>
            <p className="text-muted-foreground mb-4">
              Under the AML/CTF Act, we are required to verify your identity for transactions of <strong className="text-foreground">$5,000 AUD
              or more</strong>. You may be asked to provide:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Government-issued photo identification (passport, driver licence)</li>
              <li>Proof of address</li>
              <li>Date of birth verification</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">5.2 Source of Funds</h3>
            <p className="text-muted-foreground">
              For transactions of <strong className="text-foreground">$10,000 AUD or more</strong>, we are required to collect information
              about the source of your funds.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">5.3 Enhanced Due Diligence</h3>
            <p className="text-muted-foreground">
              If your cumulative transactions exceed <strong className="text-foreground">$50,000 AUD</strong>, additional Enhanced Due Diligence
              (EDD) information will be required, including source of wealth documentation.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">5.4 Transaction Reporting</h3>
            <p className="text-muted-foreground">
              As a reporting entity, we are legally required to submit Threshold Transaction Reports to AUSTRAC
              for transactions involving $10,000 AUD or more in value. We may also be required to report
              suspicious matters. These obligations are non-negotiable.
            </p>
          </div>
        </section>

        {/* Order Processing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">6. Order Processing</h2>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">6.1 Order Acceptance</h3>
              <p className="text-muted-foreground mb-4">
                All orders are subject to acceptance. We reserve the right to refuse or cancel any order for reasons
                including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Failure to complete identity verification</li>
                <li>Suspected fraudulent activity</li>
                <li>Sanctions screening matches</li>
                <li>Unusual transaction patterns</li>
                <li>Product unavailability</li>
                <li>Pricing errors</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">6.2 Compliance Review</h3>
              <p className="text-muted-foreground">
                Some orders may be flagged for manual compliance review. During this time, your order will be held
                pending and you will be notified. This process typically takes 1-2 business days.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">6.3 Order Confirmation</h3>
              <p className="text-muted-foreground">
                An order is only confirmed when payment has been successfully processed and all compliance
                requirements have been satisfied. You will receive an email confirmation once your order is confirmed.
              </p>
            </div>
          </div>
        </section>

        {/* Pickup */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">7. Collection</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              All orders are available for pickup from our secure Sydney location. When collecting your order:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You will receive an email notification when your order is ready</li>
              <li>Pickup is by appointment only</li>
              <li>Valid photo ID matching your order details is required</li>
              <li>You may inspect your purchase before signing for collection</li>
              <li>Risk of loss transfers to you upon collection</li>
            </ul>
          </div>
        </section>

        {/* Returns */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">8. Returns and Refunds</h2>
          <p className="text-muted-foreground mb-4">
            Due to the nature of precious metals and price volatility:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li>Orders cannot be cancelled once payment is processed</li>
            <li>We do not offer refunds for change of mind</li>
            <li>Returns are only accepted for items that are damaged, defective, or incorrectly prepared</li>
            <li>Items must be returned in original, unopened condition with all seals intact</li>
          </ul>
          <p className="text-muted-foreground">
            For more details, please see our <Link href="/returns-refunds" className="text-primary hover:underline">Returns & Refunds Policy</Link>.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">9. Limitation of Liability</h2>
          <p className="text-muted-foreground mb-4">
            To the maximum extent permitted by law:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>We are not liable for any indirect, incidental, or consequential damages</li>
            <li>We do not provide investment advice; bullion purchases are your own decision</li>
            <li>Past performance of precious metals is not indicative of future results</li>
            <li>We are not responsible for market price fluctuations after your purchase</li>
            <li>Our liability is limited to the purchase price of the goods</li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">10. Intellectual Property</h2>
          <p className="text-muted-foreground">
            All content on this website, including text, images, logos, and design elements, is the property of
            Australian National Bullion and is protected by copyright and trademark laws. You may not reproduce,
            distribute, or use any content without our written permission.
          </p>
        </section>

        {/* Governing Law */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">11. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms are governed by the laws of New South Wales, Australia. Any disputes arising from these
            Terms or your use of our services will be subject to the exclusive jurisdiction of the courts of
            New South Wales.
          </p>
        </section>

        {/* Changes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">12. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon
            posting to our website. Your continued use of our services constitutes acceptance of any changes.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">13. Contact Information</h2>
          <p className="text-muted-foreground mb-4">
            For questions about these Terms, please contact us:
          </p>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-card-foreground font-semibold">Australian National Bullion</p>
            <p className="text-muted-foreground">Email: info@australiannationalbullion.com.au</p>
            <p className="text-muted-foreground">Sydney, NSW, Australia</p>
          </div>
        </section>

        {/* Back Link */}
        <div className="pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
