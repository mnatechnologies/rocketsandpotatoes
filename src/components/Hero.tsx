"use client";
import Link from 'next/link'
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bullion.jpg"
          alt="Premium bullion and precious metals"
          fill
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center lg:text-left">
        <div className="max-w-3xl mx-auto lg:mx-0">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-white">
                <span className="block">Premium</span>
                <span className="block gold-shimmer bg-clip-text text-transparent">Bullion Store</span>
                <span className="block">Australia</span>
              </h1>
              <p className="text-xl text-zinc-300 max-w-xl">
                Secure your wealth with certified precious metals. Live pricing, guaranteed authenticity,
                and expert guidance for your investment journey.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/products" className="inline-flex items-center justify-center px-8 py-4 rounded-md bg-primary text-black dark:text-primary-foreground shadow-gold transition-smooth hover:opacity-95 text-lg font-semibold">
                Shop Now
                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <Link href="/products?category=Gold" className="inline-flex items-center justify-center px-8 py-4 rounded-md border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-smooth text-lg font-semibold">
                Buy Gold
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 className="font-semibold mb-1 text-white">Secure Storage</h3>
                <p className="text-sm text-zinc-400">Bank-grade security</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                </div>
                <h3 className="font-semibold mb-1 text-white">Live Pricing</h3>
                <p className="text-sm text-zinc-400">Real-time updates</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18"/><path d="M18 3v3"/><path d="M6 3v3"/><path d="M3 9h18"/><path d="M10 13l-3 3 3 3"/><path d="M14 13l3 3-3 3"/></svg>
                </div>
                <h3 className="font-semibold mb-1 text-white">Certified Quality</h3>
                <p className="text-sm text-zinc-400">Guaranteed authenticity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
