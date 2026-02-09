import React from 'react';

export default function TextSection() {
  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground tracking-tight">
            Australia&#39;s Trusted Bullion Dealer
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-12 max-w-2xl mx-auto">
            Australian National Bullion is committed to providing secure, transparent, and competitive precious metals trading. As an AUSTRAC-registered dealer, we ensure full compliance with Australian anti-money laundering regulations while offering real-time pricing on gold, silver, platinum, and palladium products.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2 text-foreground">AUSTRAC Registered</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fully compliant with Australian AML/CTF regulations, ensuring secure and transparent transactions for every customer.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2 text-foreground">Live Market Pricing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time pricing based on global spot markets, updated every 5 minutes with transparent premiums and no hidden fees.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2 text-foreground">Certified Quality</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Premium bullion products from trusted refineries worldwide. Every item meets strict purity standards with authenticity guarantees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
