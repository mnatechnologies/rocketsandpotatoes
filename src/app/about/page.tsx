'use client';

import Link from 'next/link';
import { CircleDollarSign, Coins, Gem } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About Australian National Bullion
          </h1>
          <p className="text-xl text-muted-foreground">
            Your trusted partner in precious metals investment
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-4">
            At Australian National Bullion, we&#39;re committed to providing Australians with secure,
            transparent, and compliant access to precious metals investment. Whether you&#39;re looking
            to preserve wealth, diversify your portfolio, or invest in physical gold and silver,
            we make it simple and trustworthy.
          </p>
          <p className="text-lg text-muted-foreground">
            Our platform combines cutting-edge technology with unwavering commitment to regulatory
            compliance, ensuring every transaction is secure, transparent, and fully compliant with
            Australian AML/CTF regulations.
          </p>
        </section>

        {/* Why Choose Us */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">AUSTRAC Registered</h3>
              </div>
              <p className="text-muted-foreground">
                Fully registered and compliant with AUSTRAC (Australian Transaction Reports and
                Analysis Centre), ensuring all transactions meet strict AML/CTF requirements.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">Live Pricing</h3>
              </div>
              <p className="text-muted-foreground">
                Real-time spot prices sourced directly from global markets, with transparent
                premiums and no hidden fees. Lock in prices during checkout for peace of mind.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">Secure Payments</h3>
              </div>
              <p className="text-muted-foreground">
                All payments processed through Stripe with industry-leading security. Your
                financial information is never stored on our servers.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">Secure Pickup</h3>
              </div>
              <p className="text-muted-foreground">
                Collect your order from our secure location. All orders require valid ID
                and signature for collection. Your investment is protected until handover.
              </p>
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section className="mb-16">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-foreground mb-6">Regulatory Compliance</h2>
            <p className="text-muted-foreground mb-4">
              As a registered precious metals dealer under Australian AML/CTF legislation, we
              adhere to strict compliance requirements:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Customer Identification:</strong> Identity verification for transactions over $5,000 AUD</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Threshold Transaction Reporting:</strong> Automatic reporting to AUSTRAC for transactions ≥ $10,000 AUD</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Enhanced Due Diligence:</strong> Additional verification for high-value transactions (≥ $50,000 AUD)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Sanctions Screening:</strong> Automatic screening against DFAT and international sanctions lists</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Record Keeping:</strong> Comprehensive audit trails maintained for 7 years as required by law</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Products Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">Our Products</h2>
          <p className="text-lg text-muted-foreground mb-6">
            We offer a curated selection of investment-grade precious metals:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <CircleDollarSign className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Gold</h3>
              <p className="text-sm text-muted-foreground">
                Investment bars and coins from reputable mints worldwide
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-slate-400/10 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-slate-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Silver</h3>
              <p className="text-sm text-muted-foreground">
                Pure silver bullion in various weights and formats
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center">
                  <Gem className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Platinum & Palladium</h3>
              <p className="text-sm text-muted-foreground">
                Premium precious metals for diversified portfolios
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Investing?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Browse our selection of premium precious metals or get in touch with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              View Products
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
