import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Australian National Bullion',
  description: 'Privacy policy and data handling practices for Australian National Bullion.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: December 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
          <p className="text-muted-foreground mb-4">
            Australian National Bullion (ABN: XX XXX XXX XXX, AUSTRAC Registration: 100888166) is committed to
            protecting your privacy and handling your personal information in accordance with the Privacy Act 1988
            (Cth) and the Australian Privacy Principles (APPs).
          </p>
          <p className="text-muted-foreground">
            This Privacy Policy explains how we collect, use, disclose, and protect your personal information
            when you use our services for purchasing precious metals including gold, silver, platinum, and palladium.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">2.1 Identity Information</h3>
            <p className="text-muted-foreground mb-4">
              As a reporting entity under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006
              (AML/CTF Act), we are required to collect and verify customer identification information for
              transactions of $5,000 AUD or more. This includes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Full name (including any former names)</li>
              <li>Date of birth</li>
              <li>Residential address</li>
              <li>Country of residence and citizenship</li>
              <li>Occupation and business activities</li>
              <li>Government-issued identification documents (passport, driver licence)</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">2.2 Transaction Information</h3>
            <p className="text-muted-foreground mb-4">
              We collect details of your transactions including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Purchase history and transaction amounts</li>
              <li>Payment method details (processed securely via Stripe)</li>
              <li>Source of funds declarations (for transactions over $10,000 AUD)</li>
              <li>Source of wealth information (for cumulative transactions over $50,000 AUD)</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">2.3 Technical Information</h3>
            <p className="text-muted-foreground mb-4">
              We automatically collect certain technical information when you visit our website:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>IP address and geographic location</li>
              <li>Browser type and device information</li>
              <li>Pages visited and time spent on our website</li>
              <li>Referring website addresses</li>
            </ul>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">3.1 Service Delivery</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Processing your orders and payments</li>
                <li>Arranging pickup of purchased bullion</li>
                <li>Providing customer support</li>
                <li>Sending order confirmations and pickup notifications</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">3.2 Regulatory Compliance</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Verifying your identity as required by the AML/CTF Act</li>
                <li>Conducting sanctions screening against DFAT consolidated lists</li>
                <li>Monitoring transactions for suspicious activity</li>
                <li>Submitting Threshold Transaction Reports (TTRs) to AUSTRAC for transactions over $10,000</li>
                <li>Submitting Suspicious Matter Reports (SMRs) when required</li>
                <li>Conducting Enhanced Due Diligence for high-value customers</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">3.3 Risk Management</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Assessing and managing money laundering and terrorism financing risks</li>
                <li>Detecting potential structuring or unusual transaction patterns</li>
                <li>Preventing fraud and maintaining security</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Information Sharing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Information Sharing and Disclosure</h2>
          <p className="text-muted-foreground mb-4">
            We may share your personal information with:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
            <li><strong className="text-foreground">AUSTRAC:</strong> As required under the AML/CTF Act for threshold transaction reports, suspicious matter reports, and compliance reporting</li>
            <li><strong className="text-foreground">Law enforcement agencies:</strong> When required by law or to assist with investigations</li>
            <li><strong className="text-foreground">Payment processors:</strong> Stripe processes payments securely on our behalf</li>
            <li><strong className="text-foreground">Identity verification services:</strong> For electronic verification of your identity</li>
            <li><strong className="text-foreground">Professional advisors:</strong> Lawyers, accountants, and auditors as necessary</li>
          </ul>
          <p className="text-muted-foreground">
            We will never sell your personal information to third parties for marketing purposes.
          </p>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Security</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organisational measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>All data is encrypted in transit using TLS/SSL</li>
              <li>Sensitive data is encrypted at rest</li>
              <li>Payment processing is handled by PCI-DSS compliant Stripe</li>
              <li>Access to personal information is restricted to authorised personnel</li>
              <li>Regular security assessments and monitoring</li>
              <li>Secure cloud infrastructure with enterprise-grade security</li>
            </ul>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">6. Data Retention</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              Under the AML/CTF Act, we are required to retain customer identification records and transaction
              records for at least <strong className="text-foreground">7 years</strong> after the end of your relationship with us or
              after the relevant transaction.
            </p>
            <p className="text-muted-foreground">
              Records relating to suspicious matter reports and threshold transaction reports are retained
              in accordance with AUSTRAC requirements.
            </p>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">7. Your Rights</h2>
          <p className="text-muted-foreground mb-4">Under Australian privacy law, you have the right to:</p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request information about how your data is being used</li>
            <li>Lodge a complaint if you believe your privacy has been breached</li>
          </ul>
          <p className="text-muted-foreground">
            Note: We may be unable to delete certain information where retention is required by law
            (such as AML/CTF record-keeping obligations).
          </p>
        </section>

        {/* Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">8. Cookies and Tracking</h2>
          <p className="text-muted-foreground mb-4">
            Our website uses cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li>Maintain your session and shopping cart</li>
            <li>Remember your preferences</li>
            <li>Analyse website traffic and usage patterns</li>
            <li>Improve our services</li>
          </ul>
          <p className="text-muted-foreground">
            You can control cookies through your browser settings, though disabling cookies may affect
            website functionality.
          </p>
        </section>

        {/* Changes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">9. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page
            with an updated revision date. We encourage you to review this policy periodically.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Us</h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
          </p>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-card-foreground font-semibold">Privacy Officer</p>
            <p className="text-muted-foreground">Australian National Bullion</p>
            <p className="text-muted-foreground">Email: privacy@australiannationalbullion.com.au</p>
            <p className="text-muted-foreground">Sydney, NSW, Australia</p>
          </div>
        </section>

        {/* Complaints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">11. Complaints</h2>
          <p className="text-muted-foreground mb-4">
            If you are not satisfied with our response to a privacy concern, you may lodge a complaint with
            the Office of the Australian Information Commissioner (OAIC):
          </p>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-card-foreground font-semibold">Office of the Australian Information Commissioner</p>
            <p className="text-muted-foreground">Website: www.oaic.gov.au</p>
            <p className="text-muted-foreground">Phone: 1300 363 992</p>
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
