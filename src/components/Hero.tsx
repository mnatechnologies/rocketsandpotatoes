"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Slide data                                                         */
/* ------------------------------------------------------------------ */
interface Slide {
  badge: string;
  headlineParts: { text: string; shimmer?: boolean; muted?: boolean }[];
  description: string;
  cta: { label: string; href: string; primary?: boolean }[];
  features: { icon: React.ReactNode; title: string; subtitle: string }[];
  image: string;
  imageAlt: string;
}

const SLIDES: Slide[] = [
  /* ---------- Slide 1 - Original hero ---------- */
  {
    badge: "AUSTRAC Registered Dealer",
    headlineParts: [
      { text: "Invest in" },
      { text: "Precious Metals", shimmer: true },
      { text: "with Confidence", muted: true },
    ],
    description:
      "Secure your wealth with certified precious metals. Live market pricing, guaranteed authenticity, and full regulatory compliance.",
    cta: [
      { label: "Browse Products", href: "/products", primary: true },
      { label: "View Live Prices", href: "/charts" },
    ],
    features: [
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
        title: "Secure",
        subtitle: "Bank-grade security",
      },
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
            <path d="M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        ),
        title: "Live Pricing",
        subtitle: "Real-time updates",
      },
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        title: "Certified",
        subtitle: "Guaranteed authenticity",
      },
    ],
    image: "/hero-bullion.jpg",
    imageAlt: "Premium bullion and precious metals",
  },

  /* ---------- Slide 2 - Gold Investment ---------- */
  {
    badge: "Gold Investment",
    headlineParts: [
      { text: "Build Wealth with" },
      { text: "Gold Bullion", shimmer: true },
      { text: "that Endures", muted: true },
    ],
    description:
      "Gold has preserved wealth for millennia. Our investment-grade gold bars and coins offer the purest form of financial security.",
    cta: [
      { label: "Shop Gold", href: "/products?category=Gold", primary: true },
      { label: "Learn More", href: "/about" },
    ],
    features: [
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        ),
        title: "99.99% Pure",
        subtitle: "Investment grade",
      },
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
        ),
        title: "Trusted Mints",
        subtitle: "Perth Mint & more",
      },
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        ),
        title: "AUD Pricing",
        subtitle: "No hidden FX fees",
      },
    ],
    image: "/hero-bullion.jpg",
    imageAlt: "Investment-grade gold bullion bars",
  },

  /* ---------- Slide 3 - Silver Collection ---------- */
  {
    badge: "Silver Bullion",
    headlineParts: [
      { text: "Discover Our" },
      { text: "Silver Collection", shimmer: true },
      { text: "at Spot + Premium", muted: true },
    ],
    description:
      "From 1oz coins to kilo bars, our silver range offers accessible entry points for new investors and seasoned collectors alike.",
    cta: [
      { label: "Shop Silver", href: "/products?category=Silver", primary: true },
      { label: "View Charts", href: "/charts" },
    ],
    features: [
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
        title: "Live Spot",
        subtitle: "Transparent pricing",
      },
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        ),
        title: "From 1oz",
        subtitle: "Accessible sizing",
      },
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
        ),
        title: "Bulk Deals",
        subtitle: "Volume discounts",
      },
    ],
    image: "/hero-bullion.jpg",
    imageAlt: "Silver bullion coins and bars collection",
  },

  /* ---------- Slide 4 - Secure & Compliant ---------- */
  {
    badge: "Trusted & Compliant",
    headlineParts: [
      { text: "Your Metals," },
      { text: "Fully Secured", shimmer: true },
      { text: "& Compliant", muted: true },
    ],
    description:
      "Every transaction is protected by AUSTRAC-regulated compliance, encrypted payments, and insured delivery across Australia.",
    cta: [
      { label: "Start Buying", href: "/products", primary: true },
      { label: "Contact Us", href: "/contact" },
    ],
    features: [
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        ),
        title: "Encrypted",
        subtitle: "Secure checkout",
      },
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 18H3a2 2 0 01-2-2V8a2 2 0 012-2h3.19M15 6h2a2 2 0 012 2v1M5 6l7-3 7 3" />
            <path d="M15 6v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6" />
          </svg>
        ),
        title: "Insured",
        subtitle: "Delivery covered",
      },
      {
        icon: (
          <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
        title: "AML/CTF",
        subtitle: "Full compliance",
      },
    ],
    image: "/hero-bullion.jpg",
    imageAlt: "Secure precious metals storage and delivery",
  },
];

const SLIDE_INTERVAL = 6000; // 6 seconds

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = SLIDES.length;

  /* ---- auto-advance ---- */
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection("next");
      setIsAnimating(true);
      setCurrent((prev) => (prev + 1) % total);
    }, SLIDE_INTERVAL);
  }, [total]);

  useEffect(() => {
    if (!isHovered) {
      startTimer();
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, startTimer]);

  /* ---- navigation helpers ---- */
  const goTo = useCallback(
    (index: number) => {
      if (index === current || isAnimating) return;
      setDirection(index > current ? "next" : "prev");
      setIsAnimating(true);
      setCurrent(index);
      startTimer();
    },
    [current, isAnimating, startTimer],
  );

  const goNext = useCallback(() => {
    if (isAnimating) return;
    setDirection("next");
    setIsAnimating(true);
    setCurrent((prev) => (prev + 1) % total);
    startTimer();
  }, [isAnimating, total, startTimer]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    setDirection("prev");
    setIsAnimating(true);
    setCurrent((prev) => (prev - 1 + total) % total);
    startTimer();
  }, [isAnimating, total, startTimer]);

  /* clear animating flag after transition */
  useEffect(() => {
    const timeout = setTimeout(() => setIsAnimating(false), 700);
    return () => clearTimeout(timeout);
  }, [current]);

  /* ---- touch / swipe support ---- */
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  /* ---------------------------------------------------------------- */
  return (
    <section
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Hero carousel"
    >
      {/* ---- Background layers (all slides stacked, opacity-driven) ---- */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 z-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <Image
            src={slide.image}
            alt={slide.imageAlt}
            fill
            priority={i === 0}
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </div>
      ))}

      {/* ---- Slide content ---- */}
      <div className="relative z-10 container mx-auto px-4 lg:px-6 pb-16 sm:pb-20 text-center lg:text-left">
        <div className="max-w-2xl mx-auto lg:mx-0">
          {SLIDES.map((slide, i) => {
            const isActive = i === current;
            const animDir = direction === "next" ? 1 : -1;
            return (
              <div
                key={i}
                className="hero-slide-content"
                style={{
                  position: i === 0 ? "relative" : "absolute",
                  top: i === 0 ? undefined : 0,
                  left: i === 0 ? undefined : 0,
                  right: i === 0 ? undefined : 0,
                  opacity: isActive ? 1 : 0,
                  transform: isActive
                    ? "translateY(0)"
                    : `translateY(${animDir * 24}px)`,
                  transition: "opacity 0.6s ease-in-out, transform 0.6s ease-in-out",
                  pointerEvents: isActive ? "auto" : "none",
                  visibility: isActive ? "visible" : "hidden",
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${i + 1} of ${total}`}
                aria-hidden={!isActive}
              >
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Badge */}
                    <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary/90">
                      {slide.badge}
                    </p>

                    {/* Headline */}
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-white tracking-tight">
                      {slide.headlineParts.map((part, pi) => (
                        <span
                          key={pi}
                          className={`block ${
                            part.shimmer
                              ? "gold-shimmer bg-clip-text text-transparent"
                              : part.muted
                                ? "text-white/90"
                                : ""
                          }`}
                        >
                          {part.text}
                        </span>
                      ))}
                    </h2>

                    {/* Description */}
                    <p className="text-base sm:text-lg text-white/60 max-w-lg leading-relaxed">
                      {slide.description}
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    {slide.cta.map((c, ci) =>
                      c.primary ? (
                        <Link
                          key={ci}
                          href={c.href}
                          className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-primary text-primary-foreground shadow-gold transition-all hover:shadow-premium hover:brightness-110 text-base font-semibold"
                        >
                          {c.label}
                          <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </Link>
                      ) : (
                        <Link
                          key={ci}
                          href={c.href}
                          className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg border border-white/15 bg-white/5 backdrop-blur-sm text-white/90 hover:bg-white/10 hover:border-white/25 transition-all text-base font-semibold"
                        >
                          {c.label}
                        </Link>
                      ),
                    )}
                  </div>

                  {/* Feature cards */}
                  <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-white/10">
                    {slide.features.map((f, fi) => (
                      <div key={fi} className="text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start mb-2">
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            {f.icon}
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm text-white">{f.title}</h3>
                        <p className="text-xs text-white/40 mt-0.5">{f.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Arrow controls (hidden on mobile, visible sm+) ---- */}
      <button
        onClick={goPrev}
        className="absolute left-5 top-1/2 -translate-y-1/2 z-20 hidden sm:flex w-11 h-11 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm items-center justify-center text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
        aria-label="Previous slide"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        onClick={goNext}
        className="absolute right-5 top-1/2 -translate-y-1/2 z-20 hidden sm:flex w-11 h-11 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm items-center justify-center text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
        aria-label="Next slide"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ---- Bottom bar: arrows (mobile) + dots ---- */}
      <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4" role="tablist" aria-label="Slide navigation">
        {/* Mobile prev arrow */}
        <button
          onClick={goPrev}
          className="sm:hidden w-8 h-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Previous slide"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative h-2 rounded-full transition-all duration-500 cursor-pointer ${
                i === current ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"
              }`}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide ${i + 1}`}
            >
              {i === current && !isHovered && (
                <span
                  className="absolute inset-0 rounded-full bg-primary/60 origin-left"
                  style={{
                    animation: `hero-dot-progress ${SLIDE_INTERVAL}ms linear forwards`,
                  }}
                  key={`progress-${current}`}
                />
              )}
            </button>
          ))}
        </div>

        {/* Mobile next arrow */}
        <button
          onClick={goNext}
          className="sm:hidden w-8 h-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Next slide"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
