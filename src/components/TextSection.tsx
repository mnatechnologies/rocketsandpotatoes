import React from 'react';

export default function TextSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Australia's Trusted Bullion Dealer
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Australian National Bullion is committed to providing secure, transparent, and competitive precious metals trading. As an AUSTRAC-registered dealer, we ensure full compliance with Australian anti-money laundering regulations while offering real-time pricing on gold, silver, platinum, and palladium products. Whether you're investing in wealth preservation, portfolio diversification, or collecting premium bullion, we deliver certified quality and secure transactions you can trust.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-primary">AUSTRAC Registered</h3>
              <p className="text-muted-foreground">
                Fully compliant with Australian AML/CTF regulations, ensuring secure and transparent transactions. Our registration demonstrates our commitment to regulatory excellence and customer protection.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-primary">Live Market Pricing</h3>
              <p className="text-muted-foreground">
                Real-time pricing based on global spot markets, updated every 5 minutes. Our transparent pricing model ensures you always get fair market value for your precious metals investments.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-primary">Certified Quality</h3>
              <p className="text-muted-foreground">
                Premium bullion products from trusted refineries worldwide. Every item meets strict purity standards, with detailed specifications and authenticity guarantees for your peace of mind.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
