import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | Australian National Bullion',
  description: 'Cookie policy for Australian National Bullion. Learn how we use cookies on our website.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* What Are Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">1. What Are Cookies</h2>
          <p className="text-muted-foreground mb-4">
            Cookies are small text files that are stored on your device when you visit a website. They are widely
            used to make websites work efficiently, provide a better browsing experience, and give site owners
            useful information about how their site is being used.
          </p>
          <p className="text-muted-foreground">
            Australian National Bullion uses cookies to ensure our website functions correctly, to keep your
            account secure, and to remember your preferences. This policy explains what cookies we use and why.
          </p>
        </section>

        {/* Essential Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Essential Cookies</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
            <p className="text-muted-foreground mb-4">
              Essential cookies are required for the website to function and <strong className="text-foreground">cannot be disabled</strong>.
              Without these cookies, core features such as account login and secure checkout would not work.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">Authentication Cookies</h3>
            <p className="text-muted-foreground mb-4">
              We use Clerk for authentication. When you sign in, Clerk sets session cookies that keep you
              securely logged in as you navigate the site. These cookies are encrypted and are essential
              for verifying your identity and protecting your account.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Session tokens to maintain your authenticated state</li>
              <li>Security tokens to prevent cross-site request forgery</li>
              <li>Device recognition for account protection</li>
            </ul>
          </div>
        </section>

        {/* Payment Processing Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">3. Payment Processing Cookies</h2>
          <p className="text-muted-foreground mb-4">
            Our payment processor, Stripe, sets cookies during checkout and identity verification to prevent
            fraud, maintain session state, and comply with payment security requirements (PCI-DSS).
          </p>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">Stripe Cookies</h3>
            <p className="text-muted-foreground mb-3">
              These cookies are essential for completing transactions securely. They cannot be disabled
              while using checkout or identity verification features.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fraud detection and prevention</li>
              <li>Payment session management</li>
              <li>Device fingerprinting for security</li>
              <li>Identity verification session tracking</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">
              These cookies are governed by{' '}
              <a href="https://stripe.com/au/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Stripe&apos;s Privacy Policy
              </a>.
            </p>
          </div>
        </section>

        {/* Functional Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Functional Cookies</h2>
          <p className="text-muted-foreground mb-4">
            Functional cookies allow the website to remember choices you make and provide enhanced, personalised
            features. These cookies improve your experience but are not strictly necessary for the site to operate.
          </p>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Currency Preference</h3>
              <p className="text-muted-foreground">
                We store your preferred display currency (AUD or USD) so that prices are shown in your
                chosen currency each time you visit.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Theme Preference</h3>
              <p className="text-muted-foreground">
                Your light or dark mode preference is stored locally so the site displays in your chosen
                theme on subsequent visits.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Cart Data</h3>
              <p className="text-muted-foreground">
                Items in your shopping cart are stored locally so your selections persist if you navigate
                away and return later.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Cookie Consent Preference</h3>
              <p className="text-muted-foreground">
                When you accept our cookie notice, your consent is recorded in local storage so the
                banner is not displayed again on future visits.
              </p>
            </div>
          </div>
        </section>

        {/* How to Manage Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">5. How to Manage Cookies</h2>
          <p className="text-muted-foreground mb-4">
            Most web browsers allow you to control cookies through their settings. You can typically find
            cookie management options in your browser&apos;s &quot;Settings&quot;, &quot;Preferences&quot;, or &quot;Privacy&quot; section.
          </p>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">Common Browser Instructions</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data
              </li>
              <li>
                <strong className="text-foreground">Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data
              </li>
              <li>
                <strong className="text-foreground">Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data
              </li>
              <li>
                <strong className="text-foreground">Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies and site data
              </li>
            </ul>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Please note:</strong> Disabling essential cookies will prevent you from signing in
              and completing purchases on our website. We recommend keeping essential cookies enabled for
              the best experience.
            </p>
          </div>
        </section>

        {/* Changes to This Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">6. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for
            legal, operational, or regulatory reasons. Any changes will be posted on this page with an
            updated revision date. We encourage you to review this policy periodically.
          </p>
        </section>

        {/* Contact Us */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Us</h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions about our use of cookies, please contact us:
          </p>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-card-foreground font-semibold">Privacy Officer</p>
            <p className="text-muted-foreground">Australian National Bullion</p>
            <p className="text-muted-foreground">Email: privacy@australiannationalbullion.com.au</p>
            <p className="text-muted-foreground">Sydney, NSW, Australia</p>
          </div>
        </section>

        {/* Back Links */}
        <div className="pt-8 border-t border-border flex flex-col gap-2 sm:flex-row sm:gap-6">
          <Link href="/privacy-policy" className="text-primary hover:underline font-medium">
            &larr; Privacy Policy
          </Link>
          <Link href="/" className="text-primary hover:underline font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
