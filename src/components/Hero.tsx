"use client";
import Link from 'next/link'
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bullion.jpg"
          alt="Premium bullion and precious metals"
          fill
          priority
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-6 text-center lg:text-left">
        <div className="max-w-2xl mx-auto lg:mx-0">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary/90">
                AUSTRAC Registered Dealer
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-white tracking-tight">
                <span className="block">Invest in</span>
                <span className="block gold-shimmer bg-clip-text text-transparent">Precious Metals</span>
                <span className="block text-white/90">with Confidence</span>
              </h1>
              <p className="text-base sm:text-lg text-white/60 max-w-lg leading-relaxed">
                Secure your wealth with certified precious metals. Live market pricing, guaranteed authenticity,
                and full regulatory compliance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/products" className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-primary text-primary-foreground shadow-gold transition-all hover:shadow-premium hover:brightness-110 text-base font-semibold">
                Browse Products
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <Link href="/charts" className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg border border-white/15 bg-white/5 backdrop-blur-sm text-white/90 hover:bg-white/10 hover:border-white/25 transition-all text-base font-semibold">
                View Live Prices
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-white/10">
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-white">Secure</h3>
                <p className="text-xs text-white/40 mt-0.5">Bank-grade security</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-white">Live Pricing</h3>
                <p className="text-xs text-white/40 mt-0.5">Real-time updates</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-white">Certified</h3>
                <p className="text-xs text-white/40 mt-0.5">Guaranteed authenticity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
