import Link from 'next/link';

export const metadata = {
  title: 'Returns & Refunds | Australian National Bullion',
  description: 'Returns and refunds policy for precious metals purchases from Australian National Bullion.',
};

export default function ReturnsRefundsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Returns & Refunds</h1>
          <p className="text-muted-foreground">Our policy for returns and refunds on precious metals</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Important Notice */}
        <section className="mb-12">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <svg className="w-12 h-12 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Important: Nature of Precious Metals</h2>
                <p className="text-muted-foreground">
                  Due to the volatile nature of precious metals markets, our returns and refunds policy differs
                  from typical retail policies. Prices fluctuate constantly, and once an order is placed,
                  the market price is locked in for that transaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Policy Overview</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">No Cancellations After Payment</h4>
                  <p className="text-muted-foreground text-sm">
                    Orders cannot be cancelled once payment has been processed due to immediate price locking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">No Change of Mind Returns</h4>
                  <p className="text-muted-foreground text-sm">
                    We do not accept returns for change of mind. Please ensure you are certain before purchasing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="font-semibold text-card-foreground">Faulty or Incorrect Items</h4>
                  <p className="text-muted-foreground text-sm">
                    Returns are accepted for items that are damaged, defective, or incorrectly shipped.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* When We Accept Returns */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">When Returns Are Accepted</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-6">We will accept returns and provide a refund or replacement in the following circumstances:</p>

            <div className="space-y-4">
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h3 className="font-semibold text-card-foreground mb-2">Damaged Products</h3>
                <p className="text-muted-foreground text-sm">
                  If your items arrive damaged during shipping, we will arrange a return and provide a full refund
                  or replacement at your choice. Damage must be reported within 48 hours of delivery.
                </p>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h3 className="font-semibold text-card-foreground mb-2">Defective Products</h3>
                <p className="text-muted-foreground text-sm">
                  Products with manufacturing defects that affect authenticity or value will be exchanged or refunded.
                  Examples include incorrect weight, purity issues, or significant minting errors.
                </p>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h3 className="font-semibold text-card-foreground mb-2">Incorrect Items</h3>
                <p className="text-muted-foreground text-sm">
                  If we ship you the wrong product, we will cover return shipping and send the correct item
                  immediately, or provide a full refund if the correct item is unavailable.
                </p>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h3 className="font-semibold text-card-foreground mb-2">Missing Items</h3>
                <p className="text-muted-foreground text-sm">
                  If items are missing from your order, contact us immediately. We will investigate and ship
                  the missing items or provide a refund for any items not received.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Return Process */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">How to Return</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Contact Us First</h4>
                  <p className="text-muted-foreground text-sm">
                    Before returning any item, contact our support team with your order number and reason for return.
                    We will provide a Return Merchandise Authorisation (RMA) number and instructions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Document the Issue</h4>
                  <p className="text-muted-foreground text-sm">
                    Take clear photos of any damage or defects. For damaged shipments, also photograph the packaging.
                    This helps us process your return quickly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Ship Securely</h4>
                  <p className="text-muted-foreground text-sm">
                    For approved returns, we will provide a prepaid shipping label. Pack items in original packaging
                    if possible. All seals and certificates must be intact.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Receive Refund</h4>
                  <p className="text-muted-foreground text-sm">
                    Once we receive and inspect the returned item, refunds are processed within 5 business days.
                    Refunds are issued to the original payment method.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conditions for Returns */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Return Conditions</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">To be eligible for return, items must:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Be in original, unopened condition where applicable</li>
              <li>Have all original seals, packaging, and certificates intact</li>
              <li>Be returned within 14 days of delivery (for quality issues)</li>
              <li>Include the RMA number provided by our team</li>
              <li>Not show signs of tampering, cleaning, or alteration</li>
            </ul>

            <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-primary text-sm">
                <strong>Note:</strong> Items returned without authorisation or outside the conditions above
                may be refused and returned to you at your expense.
              </p>
            </div>
          </div>
        </section>

        {/* Refund Timing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Refund Processing</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 text-foreground font-semibold">Payment Method</th>
                  <th className="text-left py-4 px-6 text-foreground font-semibold">Refund Timeframe</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="py-4 px-6">Credit/Debit Card</td>
                  <td className="py-4 px-6">5-10 business days</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="py-4 px-6">Bank Transfer</td>
                  <td className="py-4 px-6">3-5 business days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground text-sm mt-4">
            Timeframes begin after we receive and approve the returned item. Your bank may take additional
            time to process the refund to your account.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Need to Request a Return?</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-card-foreground font-semibold">Returns Support Team</p>
            <p className="text-muted-foreground mb-4">Contact our support team with your order number and details about the issue. We aim to respond within 24 hours on business days.</p>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                <strong className="text-card-foreground">Email:</strong> returns@australiannationalbullion.com.au
              </p>
              <p className="text-muted-foreground">
                <strong className="text-card-foreground">Phone:</strong> 1300 XXX XXX
              </p>
            </div>
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
