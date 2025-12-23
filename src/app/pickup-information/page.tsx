import Link from 'next/link';

export const metadata = {
  title: 'Pickup Information | Australian National Bullion',
  description: 'Information about collecting your precious metals order in person from Australian National Bullion.',
};

export default function PickupInformationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Pickup Information</h1>
          <p className="text-muted-foreground">Collect your order in person from our Sydney location</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">In-Person Collection</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              Prefer to collect your precious metals in person? We offer secure pickup from our Sydney location
              for customers who want to avoid shipping or simply prefer face-to-face transactions.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-primary text-sm">
                <strong>Important:</strong> Pickup is by appointment only. All identity verification and compliance
                requirements must be completed before collection.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">How Pickup Works</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Select Pickup at Checkout</h4>
                  <p className="text-muted-foreground text-sm">
                    When completing your order, choose "Pickup" as your delivery method instead of shipping.
                    This option saves on delivery fees for local customers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Complete Verification</h4>
                  <p className="text-muted-foreground text-sm">
                    For orders over $5,000 AUD, complete identity verification through our secure online process.
                    This must be done before your pickup appointment.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Schedule Appointment</h4>
                  <p className="text-muted-foreground text-sm">
                    Once your order is confirmed and any verification is complete, we'll contact you to schedule
                    a pickup appointment. Appointments are available Monday to Friday during business hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Collect Your Order</h4>
                  <p className="text-muted-foreground text-sm">
                    Bring valid photo ID matching your order details. You'll be able to inspect your purchase
                    before signing for collection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What to Bring */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">What to Bring</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Required</h3>
              <ul className="text-muted-foreground space-y-2">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Valid photo ID (passport or driver licence)
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Order confirmation email
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Appointment confirmation
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Recommended</h3>
              <ul className="text-muted-foreground space-y-2">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Discreet bag or container for transport
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Secure transport arrangements for large orders
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Pickup Location</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-card-foreground mb-2">Australian National Bullion</h3>
              <p className="text-muted-foreground mb-4">
                Sydney, NSW, Australia<br />
                <span className="text-muted-foreground text-sm">(Full address provided upon booking confirmation)</span>
              </p>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-medium text-card-foreground mb-2">Appointment Hours</h4>
                <p className="text-muted-foreground">
                  Monday - Friday: 9:00 AM - 5:00 PM AEST<br />
                  Saturday - Sunday: Closed
                </p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-primary text-sm">
                <strong>Note:</strong> For security reasons, our precise address is only shared with customers
                who have confirmed pickup appointments. Walk-ins are not accepted.
              </p>
            </div>
          </div>
        </section>

        {/* Third-Party Collection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Collection</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              If you're unable to collect your order in person, you may authorise a third party to collect on your behalf.
            </p>
            <p className="text-muted-foreground mb-4">
              Requirements for third-party collection:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Written authorisation from the account holder</li>
              <li>Copy of the account holder's ID</li>
              <li>Valid photo ID of the person collecting</li>
              <li>Prior notification to our team (minimum 24 hours)</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Questions About Pickup?</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-card-foreground font-semibold">Pickup Support Team</p>
            <p className="text-muted-foreground mb-4">Contact our team to schedule your pickup appointment or ask any questions.</p>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                <strong className="text-card-foreground">Email:</strong> pickups@australiannationalbullion.com.au
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
