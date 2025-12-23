import Link from 'next/link';

export const metadata = {
  title: 'KYC Requirements | Australian National Bullion',
  description: 'Know Your Customer verification requirements for precious metals purchases.',
};

export default function KYCRequirementsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">KYC Requirements</h1>
          <p className="text-muted-foreground">Know Your Customer - Identity Verification Guide</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Why KYC */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Why We Verify Identity</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              As an AUSTRAC-registered bullion dealer (Registration: 100888166), we are legally required
              to verify customer identities under the Anti-Money Laundering and Counter-Terrorism Financing
              Act 2006 (AML/CTF Act).
            </p>
            <p className="text-muted-foreground">
              Identity verification helps prevent financial crimes including money laundering, terrorism financing,
              fraud, and identity theft. It protects both our customers and the integrity of the precious metals market.
            </p>
          </div>
        </section>

        {/* Verification Thresholds */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">When Verification is Required</h2>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">$5K</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Standard KYC Verification</h3>
                  <p className="text-muted-foreground mb-2">
                    Required for single transactions of <strong className="text-foreground">$5,000 AUD or more</strong>
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground text-sm space-y-1">
                    <li>Government-issued photo ID verification</li>
                    <li>Name, date of birth, and address confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">$10K</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Source of Funds Declaration</h3>
                  <p className="text-muted-foreground mb-2">
                    Required for transactions of <strong className="text-foreground">$10,000 AUD or more</strong>
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground text-sm space-y-1">
                    <li>All KYC requirements plus:</li>
                    <li>Declaration of where the funds originated</li>
                    <li>Threshold Transaction Report submitted to AUSTRAC</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">$50K</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Enhanced Due Diligence (EDD)</h3>
                  <p className="text-muted-foreground mb-2">
                    Required when cumulative transactions exceed <strong className="text-foreground">$50,000 AUD</strong>
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground text-sm space-y-1">
                    <li>All previous requirements plus:</li>
                    <li>Source of wealth documentation</li>
                    <li>Purpose of bullion purchase</li>
                    <li>Enhanced ongoing monitoring</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">How We Verify Your Identity</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">Electronic Verification</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                Our primary method using Stripe Identity - fast, secure, and private.
              </p>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>Photo of your ID document</li>
                <li>Selfie for liveness check</li>
                <li>Typically completes in minutes</li>
                <li>Encrypted and secure processing</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">Manual Verification</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-3">
                Alternative method if electronic verification is unavailable.
              </p>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>Upload certified document copies</li>
                <li>Additional proof of address may be needed</li>
                <li>Takes 1-2 business days to process</li>
                <li>May require in-person verification at pickup</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Accepted Documents */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Accepted Documents</h2>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Primary ID Documents</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-muted-foreground">Australian Passport</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-muted-foreground">Foreign Passport</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-muted-foreground">Australian Driver Licence</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-muted-foreground">State/Territory Photo ID Card</span>
              </div>
            </div>
          </div>
        </section>

        {/* Source of Funds vs Source of Wealth */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Source of Funds vs Source of Wealth</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Source of Funds</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Where the money for <em>this specific transaction</em> came from.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground text-sm space-y-1">
                <li>Savings account</li>
                <li>Sale of property</li>
                <li>Employment income</li>
                <li>Investment returns</li>
              </ul>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Source of Wealth</h3>
              <p className="text-muted-foreground text-sm mb-3">
                How you accumulated your <em>overall wealth</em> over time.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground text-sm space-y-1">
                <li>Employment over career</li>
                <li>Business ownership</li>
                <li>Investment portfolio</li>
                <li>Family inheritance</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Privacy Note */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Privacy</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              Your identification documents and personal information are:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Encrypted during transmission and storage</li>
              <li>Processed securely through Stripe Identity</li>
              <li>Only accessed by authorised compliance personnel</li>
              <li>Retained only as required by law (7 years)</li>
              <li>Never sold or shared for marketing purposes</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              See our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for details.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Common Questions</h2>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-card-foreground mb-2">How long does verification take?</h3>
              <p className="text-muted-foreground text-sm">
                Electronic verification through Stripe Identity typically completes within minutes.
                Manual verification may take 1-2 business days.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-card-foreground mb-2">Do I need to verify for every purchase?</h3>
              <p className="text-muted-foreground text-sm">
                No. Once verified, your status remains valid for future purchases. You may need to
                re-verify if your details change or for Enhanced Due Diligence at higher thresholds.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-card-foreground mb-2">Can I verify in person at pickup?</h3>
              <p className="text-muted-foreground text-sm">
                Yes. You must bring valid photo ID when collecting your order. This serves as additional
                verification and confirms you are the account holder.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Need Help?</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              If you have questions about verification or need assistance:
            </p>
            <p className="text-card-foreground font-semibold">Compliance Team</p>
            <p className="text-muted-foreground">Email: compliance@australiannationalbullion.com.au</p>
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
