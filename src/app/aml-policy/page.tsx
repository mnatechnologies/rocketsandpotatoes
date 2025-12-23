import Link from 'next/link';

export const metadata = {
  title: 'AML/CTF Policy | Australian National Bullion',
  description: 'Anti-Money Laundering and Counter-Terrorism Financing policy for Australian National Bullion.',
};

export default function AMLPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">AML/CTF Policy</h1>
          <p className="text-muted-foreground">Anti-Money Laundering and Counter-Terrorism Financing</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* AUSTRAC Registration */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">AUSTRAC Registered Dealer</h2>
              <p className="text-muted-foreground mb-2">
                Australian National Bullion is registered with AUSTRAC as a bullion dealer under the
                Anti-Money Laundering and Counter-Terrorism Financing Act 2006.
              </p>
              <p className="text-foreground font-semibold">Registration Number: 100888166</p>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Commitment</h2>
          <p className="text-muted-foreground mb-4">
            Australian National Bullion is committed to preventing money laundering and terrorism financing.
            We have implemented a comprehensive AML/CTF Program that meets all requirements under Australian law,
            including the AML/CTF Act 2006 and associated Rules.
          </p>
          <p className="text-muted-foreground">
            This policy outlines our approach to identifying, mitigating, and managing money laundering and
            terrorism financing (ML/TF) risks associated with our business activities.
          </p>
        </section>

        {/* What is Money Laundering */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">What is Money Laundering?</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              Money laundering is the process of making illegally obtained money appear legitimate.
              It typically involves three stages:
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Placement</h4>
                  <p className="text-muted-foreground text-sm">Introducing illegal funds into the financial system</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Layering</h4>
                  <p className="text-muted-foreground text-sm">Moving funds to distance them from their source</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Integration</h4>
                  <p className="text-muted-foreground text-sm">Re-introducing funds as apparently legitimate assets</p>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Precious metals can be attractive to money launderers due to their high value and portability.
              This is why bullion dealers are designated as &quot;reporting entities&quot; under Australian law.
            </p>
          </div>
        </section>

        {/* Our Obligations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Regulatory Obligations</h2>
          <p className="text-muted-foreground mb-6">As a registered bullion dealer, we are required to:</p>
          <div className="grid gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Maintain an AML/CTF Program</h4>
                  <p className="text-muted-foreground text-sm">A documented program covering risk assessment, customer identification, and ongoing monitoring</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Identify and Verify Customers</h4>
                  <p className="text-muted-foreground text-sm">Know Your Customer (KYC) procedures for transactions at or above threshold amounts</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Report to AUSTRAC</h4>
                  <p className="text-muted-foreground text-sm">Submit Threshold Transaction Reports (TTRs) and Suspicious Matter Reports (SMRs) as required</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Screen Against Sanctions Lists</h4>
                  <p className="text-muted-foreground text-sm">Check customers against DFAT Consolidated List and international sanctions</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Keep Records</h4>
                  <p className="text-muted-foreground text-sm">Maintain transaction and identification records for a minimum of 7 years</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Transaction Thresholds */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Transaction Thresholds</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 text-foreground font-semibold">Threshold</th>
                  <th className="text-left py-4 px-6 text-foreground font-semibold">Requirement</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="py-4 px-6">
                    <span className="font-semibold text-foreground">$5,000 AUD</span>
                  </td>
                  <td className="py-4 px-6">Customer identification and verification (KYC) required</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="py-4 px-6">
                    <span className="font-semibold text-foreground">$10,000 AUD</span>
                  </td>
                  <td className="py-4 px-6">TTR submitted to AUSTRAC; Source of funds declaration required</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="py-4 px-6">
                    <span className="font-semibold text-foreground">$50,000 AUD</span>
                    <span className="block text-sm text-muted-foreground">(cumulative)</span>
                  </td>
                  <td className="py-4 px-6">Enhanced Due Diligence (EDD); Source of wealth documentation needed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Reporting Deadlines */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Reporting Deadlines</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Threshold Transaction Reports</h3>
              <p className="text-muted-foreground text-sm mb-2">For transactions of $10,000 AUD or more</p>
              <p className="text-primary font-semibold">Deadline: 10 business days</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Suspicious Matter Reports</h3>
              <p className="text-muted-foreground text-sm mb-2">When suspicious activity is identified</p>
              <p className="text-primary font-semibold">Deadline: 3 business days</p>
            </div>
          </div>
        </section>

        {/* Sanctions Screening */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Sanctions Screening</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              We screen all customers against sanctions lists to ensure we do not facilitate transactions
              with sanctioned individuals, entities, or countries. This includes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>DFAT Consolidated List (Australian sanctions)</li>
              <li>UN Security Council sanctions</li>
              <li>Other relevant international sanctions lists</li>
            </ul>
            <p className="text-muted-foreground mt-4 text-sm">
              Customers who match against sanctions lists will be unable to transact with us.
            </p>
          </div>
        </section>

        {/* Customer Obligations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Obligations</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <p className="text-muted-foreground mb-4">When transacting with us, you are required to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and truthful information</li>
              <li>Complete identity verification when requested</li>
              <li>Declare the source of funds for large transactions</li>
              <li>Notify us of any changes to your details</li>
              <li>Not attempt to structure transactions to avoid thresholds</li>
              <li>Only use funds from legitimate sources</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Compliance Contact</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-card-foreground font-semibold">AML/CTF Compliance Officer</p>
            <p className="text-muted-foreground">Australian National Bullion</p>
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
