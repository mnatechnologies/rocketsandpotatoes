Changelog - 2026-02-24

New Seed Files

- seed/palladium_seed.sql - 5 Valcambi palladium products (50g, 100g, 500g, 1kg minted bars + 1oz pool allocated)
- seed/perth_mint_seed.sql - 62 Perth Mint products across 3 categories:
    - 39 gold bullion coins (Kangaroo, Lunar III, Chinese Myths, Emu, Koala, Kookaburra, Super Pit, Welcome Nugget, Proclamation, Rectangular Dragon)
    - 7 cast bars (6 gold + 1 silver)
    - 16 minted bars (11 gold + 5 silver, including Kangaroo, Lakshmi, Lunar Dragon/Snake/Horse)
- seed/pamp_seed.sql - 11 PAMP Suisse gold minted bars (7 Lady Fortuna + 4 Rosa), all with stock='false' for contact-to-order flow

Product Naming Consistency

- seed/products_seed.sql - Renamed all 52 ABC Bullion products to follow [Brand/Design] [Weight] [Metal] [Form] pattern matching Perth Mint convention
- seed/palladium_seed.sql - Same naming convention applied
- Examples: 0.5oz ABC Gold Cast Bar → ABC 0.5oz Gold Cast Bar, 1oz Silver Eureka Coin → Eureka 1oz Silver Coin

Image Path Fixes

- seed/products_seed.sql - Added ABC_Bullion_Photos/ prefix to all remaining category paths in both image_url and images JSON arrays (Gold_Coins, Gold_Minted_Tablets, Platinum_Minted,
  Royal_Mint_Tablets, Silver_Cast_Bars, Silver_Coins, Silver_Eureka_Range, and Gold_Cast_Bars JSON arrays)
- Added DELETE FROM price_locks before DELETE FROM products to handle FK constraint

Contact to Order Feature

- src/app/products/[id]/ProductDetailClient.tsx - PAMP Suisse products now show:
    - Amber "Contact to Order" badge instead of red "Out of Stock"
    - "Contact to Order" overlay on product image
    - Mailto button (pre-filled subject + body) replacing disabled Buy Now / Add to Cart buttons

Production Readiness — Legal, Compliance & Notices

New Pages

- src/app/cookie-policy/page.tsx - Full cookie policy with 7 sections covering essential (Clerk auth), payment processing (Stripe), and functional cookies (currency, theme, cart,
  consent)
- src/app/accessibility/page.tsx - Accessibility statement with aspirational WCAG 2.1 AA commitment, known limitations (Stripe, alt text, live pricing), and feedback contact

Cookie Consent Banner

- src/components/CookieConsent.tsx - New client component fixed to bottom of viewport with "Accept All" and "Essential Only" buttons; stores consent level in localStorage
- src/app/layout.tsx - Added CookieConsent component after Footer

Product Page Disclaimers

- src/app/products/[id]/ProductDetailClient.tsx - Added GST badge with purity-aware logic (gold ≥99.5%, silver ≥99.9%, platinum ≥99.0% show "GST-Free", palladium shows "GST May Apply"),
  pricing disclaimer ("locked for 15 minutes"), collection info, and weight disclaimer
- src/app/products/page.tsx - Added pricing disclaimer in both loading and loaded states
- src/app/charts/page.tsx - Added "For indicative purposes only — not financial advice" disclaimer

Checkout Notices

- src/app/checkout/page.tsx - Added no-returns notice (amber box) with mandatory acknowledgment checkbox gating payment flow, and pickup-only notice with link to pickup info
- src/app/cart/page.tsx - Changed "Secure pickup location" to "In-person collection — Sydney CBD" with link to /pickup-information

FAQ Updates

- src/app/faq/page.tsx - Added GST FAQ entry under Products & Pricing; replaced "Shipping & Delivery" category with "Collection & Pickup" (4 new pickup-focused FAQs)

Footer Updates

- src/components/Footer.tsx - Added Cookie Policy and Accessibility links under Legal & Compliance; added "Pickup Only — By Appointment" note in Contact section

Terms & Conditions

- src/app/terms-conditions/page.tsx - Added new Section 5 (GST) covering purity thresholds and palladium note; renumbered subsequent sections (now 14 total); fixed ABN placeholder to 14
  683 863 443; updated date to February 2026

Privacy Policy

- src/app/privacy-policy/page.tsx - Fixed ABN placeholder to 14 683 863 443; added cookie policy cross-reference in Section 8; updated date to February 2026

Returns & Refunds

- src/app/returns-refunds/page.tsx - Rewrote all shipping references to pickup/collection language (7 edits: "damaged during shipping" → "damaged at collection", "Ship Securely" →
  "Return the Item", "prepaid shipping label" → "bring to Sydney office by appointment", etc.); fixed placeholder phone to 1300 783 190

Pickup Information

- src/app/pickup-information/page.tsx - Removed shipping-as-alternative language; reframed as pickup-only model ("All orders are collected in person from our secure Sydney CBD office");
  fixed placeholder phone to 1300 783 190

Accessibility Statement

- src/app/accessibility/page.tsx - Softened declarative claims to aspirational ("We aim to make...", "We strive to maintain...")

Cross-Cutting Fixes

- Fixed price lock duration inconsistency from 10 → 15 minutes across ProductDetailClient.tsx, products/page.tsx, faq/page.tsx, terms-conditions/page.tsx
- Fixed checkout no-returns wording from "manufacturing defects" to "defective, damaged, or incorrectly supplied items"
- Added Stripe cookie disclosure (fraud detection, session management, device fingerprinting) to cookie policy as Section 3
- Aligned all "Last Updated" dates to February 2026
