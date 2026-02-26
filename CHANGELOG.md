Changelog - 2026-02-26

Xero Bank Transfer Matching (Semi-Automatic Reconciliation)

Core Logic

- src/lib/xero/bank-matching.ts — extractReferenceCode() regex matcher, isAmountMatch() exact comparator, matchBankTransfers() polls Xero for unreconciled RECEIVE transactions and matches against open orders by ANB-XXXXXX reference + exact AUD amount
- src/lib/xero/__tests__/bank-matching.test.ts — 9 unit tests covering reference extraction (embedded text, lowercase, multiple refs, no match) and amount matching (exact, floating point, zero rejection)

Cron Integration

- src/app/api/cron/bank-transfer-monitor/route.ts — Added Job 3: Xero bank transfer matching after existing reminder/expiry jobs, isolated in try/catch so Xero failures never affect payment monitoring

Database

- supabase/migrations/20260226000002_add_xero_matching_columns.sql — 4 new columns on bank_transfer_orders: xero_matched_at, xero_bank_transaction_id, xero_match_status (matched/amount_mismatch/not_found), xero_match_amount

Admin UI

- src/app/admin/bank-transfers/page.tsx — Green "Xero Matched" badge with timestamp, amber "Amount Mismatch" badge with expected vs received amounts, row highlighting for matched/mismatched orders, "Confirm (Matched)" one-click button with ring highlight

API Changes

- src/app/api/admin/bank-transfer/list/route.ts — Added xero_match_status, xero_matched_at, xero_match_amount, xero_bank_transaction_id to admin list response
- src/app/api/admin/bank-transfer/confirm-payment/route.ts — On payment confirmation, auto-reconciles the matched Xero bank transaction (non-fatal if Xero fails)

Design Docs

- docs/plans/2026-02-26-xero-bank-transfer-matching-design.md
- docs/plans/2026-02-26-xero-bank-transfer-matching-plan.md

---

Bank Transfer Payment System

Backend — API Routes & Core Logic

- src/app/api/bank-transfer/create-order/route.ts — Creates Stripe manual-capture payment intent for 10% deposit hold, inserts transaction + bank_transfer_orders record
- src/app/api/bank-transfer/confirm-hold/route.ts — Confirms hold after Stripe auth, generates unique reference (ANB-XXXXXX), starts 24hr payment window, sends invoice email, generates TTR
- src/app/api/bank-transfer/[id]/status/route.ts — Customer-facing order status endpoint
- src/app/api/bank-transfer/[id]/notify-transferred/route.ts — Customer notifies admin that bank transfer was sent
- src/app/api/bank-transfer/settings/route.ts — Public endpoint exposing enabled status, deposit percentage, payment window hours
- src/app/api/admin/bank-transfer/confirm-payment/route.ts — Admin confirms bank transfer receipt, voids Stripe hold
- src/app/api/admin/bank-transfer/cancel-order/route.ts — Admin cancels order with optional hold capture for market loss
- src/app/api/admin/bank-transfer/list/route.ts — List orders with status filter for admin dashboard
- src/app/api/admin/bank-transfer/settings/route.ts — Admin GET/PUT for bank transfer settings

Database & Types

- supabase/migrations/20260226000001_add_bank_transfer_tables.sql — New tables: bank_transfer_orders, bank_transfer_settings; new column on transactions: payment_method_type
- src/types/bank-transfer.ts — TypeScript types for BankTransferOrder, BankTransferSettings, InvoiceData, status enums

Utilities

- src/lib/bank-transfer/reference.ts — Unique reference code generator (ANB-XXXXXX format with collision retry)
- src/lib/bank-transfer/settings.ts — Settings fetcher + validateSettings() with boundary checks
- src/lib/bank-transfer/market-loss.ts — Pure function for calculating market loss on expired orders (capped at hold amount)

Email Templates

- src/emails/BankTransferInvoiceEmail.tsx — Invoice with bank details, reference code, deadline, hold disclosure
- src/emails/BankTransferReminderEmail.tsx — Urgent reminder with countdown at 18hrs
- src/emails/BankTransferConfirmedEmail.tsx — Payment confirmed, hold released notification
- src/emails/BankTransferExpiredEmail.tsx — Order expired with hold capture explanation
- src/lib/email/sendBankTransferEmails.ts — 5 sender functions: invoice, reminder, confirmed, expired, admin transfer notification

Cron Job

- src/app/api/cron/bank-transfer-monitor/route.ts — Runs every 15 min: sends reminders for approaching deadlines, expires overdue orders with market loss calculation, captures/voids Stripe holds
- vercel.json — Added cron schedule entry

Webhook & Cleanup Modifications

- src/app/api/webhooks/stripe/route.ts — Added early return for bank_transfer_deposit metadata in payment_intent.succeeded; added hold auto-expiry handling in payment_intent.canceled
- src/app/api/cron/cleanup-price-locks/route.ts — Excludes active bank transfer sessions from price lock cleanup

Frontend — Checkout Flow

- src/components/PaymentMethodSelector.tsx — Card vs bank transfer selection with deposit info and market loss policy acknowledgment checkbox
- src/components/BankTransferHoldForm.tsx — Stripe Elements form for 10% deposit card authorization
- src/components/CheckoutFlow.tsx — Added payment_method and bank_transfer_hold steps with BankTransferHoldFormWrapper

Invoice & Customer Pages

- src/app/order/[id]/invoice/page.tsx — Client component with countdown timer, copy-to-clipboard for reference/BSB/account, status polling across 5 states (pending → confirmed → expired)

Admin Pages

- src/app/admin/bank-transfers/page.tsx — Tabbed management (Awaiting Transfer/Completed/Expired) with confirm payment and cancel order modals
- src/app/admin/settings/bank-transfer/page.tsx — Settings form with validation for deposit %, payment window, bank details
- src/app/admin/page.tsx — Added bank transfers pending count widget
- src/app/admin/layout.tsx — Added nav links and breadcrumbs for bank transfer pages

Tests

- src/lib/bank-transfer/__tests__/market-loss.test.ts — 9 tests: zero capture, price drops, caps, fees, rounding, edge cases
- src/lib/bank-transfer/__tests__/settings.test.ts — 11 tests: validation rules, boundaries
- src/lib/bank-transfer/__tests__/reference.test.ts — 5 tests: format, uniqueness, collision handling
- vitest.config.ts — Added @/ path alias for test resolution

Bugfix

- src/app/api/checkout/route.ts — Fixed 404 "Customer not found" error caused by explicit business_customer_id in Supabase select query when column doesn't exist in production schema; changed select('*, business_customer_id') to select('*')

---

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
