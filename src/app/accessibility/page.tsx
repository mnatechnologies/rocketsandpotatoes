import Link from 'next/link';

export const metadata = {
  title: 'Accessibility | Australian National Bullion',
  description: 'Accessibility statement and commitment to inclusive design at Australian National Bullion.',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Accessibility Statement</h1>
          <p className="text-muted-foreground">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Our Commitment */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Our Commitment</h2>
          <p className="text-muted-foreground mb-4">
            Australian National Bullion is committed to ensuring that our website and services are accessible to
            all users, including people with disabilities. We strive to conform to the Web Content Accessibility
            Guidelines (WCAG) 2.1 at Level AA.
          </p>
          <p className="text-muted-foreground">
            We believe that everyone should be able to browse, purchase, and manage precious metal investments
            with ease, regardless of ability or the technology used to access our website.
          </p>
        </section>

        {/* Accessibility Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Accessibility Features</h2>
          <p className="text-muted-foreground mb-4">
            We have implemented the following features to support accessibility across our website:
          </p>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Keyboard Navigation</h3>
              <p className="text-muted-foreground">
                We aim to make all interactive elements, including navigation menus, forms, and buttons, fully operable
                using a keyboard. Users should be able to navigate through pages using the Tab key, activate links and
                buttons with Enter, and use standard keyboard shortcuts throughout the site.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Screen Reader Compatibility</h3>
              <p className="text-muted-foreground">
                We use semantic HTML, ARIA labels, and descriptive alt text for images to support
                compatibility with popular screen readers. We aim to define page structure clearly with headings,
                landmarks, and logical reading order.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Colour Contrast</h3>
              <p className="text-muted-foreground">
                We strive to maintain sufficient colour contrast ratios between text and background elements to meet
                WCAG 2.1 Level AA requirements, supporting readability for users with low vision or
                colour vision deficiencies.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Responsive Design</h3>
              <p className="text-muted-foreground">
                Our website is fully responsive and adapts to a wide range of screen sizes and devices,
                from desktop monitors to mobile phones and tablets. Content reflows without loss of
                information or functionality.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Text Resizing</h3>
              <p className="text-muted-foreground">
                Text can be resized up to 200% using browser zoom controls without loss of content or
                functionality. Our layout adjusts gracefully to accommodate larger text sizes.
              </p>
            </div>
          </div>
        </section>

        {/* Assistive Technology */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">3. Assistive Technology</h2>
          <p className="text-muted-foreground mb-4">
            Our website is designed to be compatible with a range of assistive technologies, including:
          </p>
          <div className="bg-card border border-border rounded-lg p-6">
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong className="text-card-foreground">Screen readers</strong> such as JAWS, NVDA, VoiceOver, and TalkBack
              </li>
              <li>
                <strong className="text-card-foreground">Voice recognition software</strong> such as Dragon NaturallySpeaking and built-in voice control features
              </li>
              <li>
                <strong className="text-card-foreground">Screen magnification tools</strong> such as ZoomText and built-in operating system magnifiers
              </li>
              <li>
                <strong className="text-card-foreground">Alternative input devices</strong> including switch access and eye-tracking systems
              </li>
            </ul>
          </div>
        </section>

        {/* Known Limitations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Known Limitations</h2>
          <p className="text-muted-foreground mb-4">
            While we strive for full accessibility, we acknowledge that some areas of our website may still
            present challenges. We are actively working to address the following:
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Some older product images may not yet have fully descriptive alt text. We are progressively
                updating these across our catalogue.
              </li>
              <li>
                Certain third-party components, such as the payment processing interface provided by Stripe,
                may have their own accessibility considerations outside of our direct control.
              </li>
              <li>
                Live pricing updates may not always be immediately announced to screen readers. We are
                investigating improvements to real-time price notifications.
              </li>
            </ul>
          </div>
        </section>

        {/* Feedback & Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">5. Feedback & Contact</h2>
          <p className="text-muted-foreground mb-4">
            We welcome your feedback on the accessibility of our website. If you encounter any barriers or
            have suggestions for improvement, please let us know. Your input helps us provide a better
            experience for everyone.
          </p>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-card-foreground font-semibold mb-3">Get in Touch</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong className="text-card-foreground">Email:</strong>{' '}
                <a href="mailto:support@australiannationalbullion.com.au" className="text-primary hover:underline">
                  support@australiannationalbullion.com.au
                </a>
              </li>
              <li>
                <strong className="text-card-foreground">Phone:</strong>{' '}
                <a href="tel:1300783190" className="text-primary hover:underline">
                  1300 783 190
                </a>
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-4">
            When contacting us about an accessibility issue, please include as much detail as possible,
            such as the page URL, a description of the problem, and the assistive technology you were using.
            We will do our best to respond within two business days.
          </p>
        </section>

        {/* Continuous Improvement */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">6. Continuous Improvement</h2>
          <p className="text-muted-foreground mb-4">
            Accessibility is an ongoing effort. We are committed to continuously improving the accessibility
            of our website through:
          </p>
          <div className="bg-card border border-border rounded-lg p-6">
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Regular accessibility audits and testing against WCAG 2.1 Level AA criteria</li>
              <li>Testing with a variety of assistive technologies and browsers</li>
              <li>Incorporating accessibility best practices into our development process</li>
              <li>Training our team on accessibility standards and inclusive design principles</li>
              <li>Reviewing and acting on user feedback to identify and resolve issues</li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-4">
            We regularly review our website to identify and fix accessibility issues, and we integrate
            accessibility considerations into the design and development of all new features.
          </p>
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
