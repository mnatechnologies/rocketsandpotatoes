import Link from 'next/link';

export const metadata = {
  title: 'Security & Insurance | Australian National Bullion',
  description: 'Learn about our security measures and insurance coverage for your precious metals purchases.',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Security & Insurance</h1>
          <p className="text-muted-foreground">Your precious metals are protected at every step</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Commitment to Security</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              At Australian National Bullion, we understand that security is paramount when dealing with precious metals.
              We have implemented comprehensive security measures across every aspect of our operations to protect your
              purchases, personal information, and financial transactions.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-foreground font-semibold">AUSTRAC Registered</p>
                  <p className="text-muted-foreground text-sm">
                    Registration Number: 100888166. We operate under strict regulatory oversight as a reporting entity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Data Security</h2>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Encryption in Transit</h3>
                  <p className="text-muted-foreground">
                    All data transmitted between your browser and our servers is encrypted using TLS 1.3.
                    This includes all personal information, payment details, and identity documents.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Encryption at Rest</h3>
                  <p className="text-muted-foreground">
                    Sensitive data stored in our systems is encrypted using AES-256 encryption.
                    This includes identity documents, verification data, and personal information.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Access Controls</h3>
                  <p className="text-muted-foreground">
                    Access to customer data is strictly limited to authorised personnel on a need-to-know basis.
                    All access is logged and audited regularly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Payment Security</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Stripe Payments</h3>
              <p className="text-muted-foreground text-sm mb-3">
                All payments are processed through Stripe, a leading global payment processor with:
              </p>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  PCI-DSS Level 1 Certification
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  3D Secure Authentication
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced Fraud Detection
                </li>
              </ul>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Your Card Data</h3>
              <p className="text-muted-foreground text-sm">
                We never store your full card details on our servers. Card information is tokenised and
                securely handled entirely by Stripe. This means even in the unlikely event of a data breach,
                your card details remain safe.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-card-foreground mb-3">Accepted Payment Methods</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-background px-3 py-1 rounded border border-border text-sm">Visa</span>
              <span className="bg-background px-3 py-1 rounded border border-border text-sm">Mastercard</span>
              <span className="bg-background px-3 py-1 rounded border border-border text-sm">American Express</span>
              <span className="bg-background px-3 py-1 rounded border border-border text-sm">Bank Transfer</span>
            </div>
            <p className="text-muted-foreground text-sm">
              We do not accept cash payments in accordance with our AML/CTF risk management procedures.
            </p>
          </div>
        </section>

        {/* Identity Verification Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Identity Verification Security</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-6">
              For transactions over $5,000 AUD, we use Stripe Identity for secure, privacy-preserving verification:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Secure Processing</h4>
                <p className="text-muted-foreground text-xs">Documents processed in encrypted environments</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Minimal Retention</h4>
                <p className="text-muted-foreground text-xs">Original images deleted after verification</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Liveness Detection</h4>
                <p className="text-muted-foreground text-xs">Prevents fraud attempts with biometrics</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pickup Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Secure Pickup</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              All orders are collected from our secure Sydney location with the following measures:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Appointment Required</h4>
                  <p className="text-muted-foreground text-sm">All pickups by appointment only for controlled access</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">ID Verification</h4>
                  <p className="text-muted-foreground text-sm">Valid photo ID required matching order details</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Inspection Before Collection</h4>
                  <p className="text-muted-foreground text-sm">Verify your purchase before signing</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Insured Until Handover</h4>
                  <p className="text-muted-foreground text-sm">Your bullion remains fully insured in our custody</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Insurance */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Insurance Coverage</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">What&apos;s Covered</h3>
            <p className="text-muted-foreground mb-4">
              All bullion in our custody is fully insured until the moment of collection:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Storage in our secure facility</li>
              <li>Processing and packaging of your order</li>
              <li>Awaiting pickup orders</li>
            </ul>
            <p className="text-muted-foreground mt-4 text-sm">
              <strong className="text-foreground">Note:</strong> Insurance coverage ends when you collect and take possession
              of your order. We recommend arranging your own insurance for valuable holdings after pickup.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Security Questions?</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              If you have questions about our security measures or need to report a concern:
            </p>
            <p className="text-card-foreground font-semibold">Email: security@australiannationalbullion.com.au</p>
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
