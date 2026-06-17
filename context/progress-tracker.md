# Progress Tracker

Update this file after every completed feature or significant change. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Backend:** P0-P6 complete (7 of 8 phases). P7 (hardening) is the only remaining phase.
**Rider app:** P0-P6 complete. P0-P2 device-verified; P3-P6 code-complete (committed, runtime verification pending). P7 (hardening) remaining.
**Driver app:** P0-P6 complete. P0-P2 device-verified; P3-P6 code-complete (committed, runtime verification pending). P7 (hardening) remaining.
**Admin:** A0-A6 complete except one stub — the "Admins & Roles" management page (`admins/page.tsx`) is still a `ComingSoon` placeholder. Build-verified; runtime verification pending for A2-A6.
**Web:** Built — a single-page marketing site (8 sections: Nav/Hero/Why/Steps/RideOptions/Testimonials/Faq/Footer; its own light design system). No backend integration (by design for marketing). See `web/context/`.

> **Bottom line:** the only outstanding work is P7 hardening (backend + both mobile apps), the admin "Admins & Roles" page, and the entire web marketing/product site.

---

## Backend Progress

- [x] P0 — Foundation (monorepo, types, scaffold, config, Docker)
- [x] P1 — Identity & KYC (auth, OTP, Google OAuth, forgot/reset pw, profiles, onboarding, document upload, NIN/liveness, places autocomplete)
- [x] P2 — Core Rides (matching, pricing, quote, ride state machine, negotiation, ride-start OTP, socket dispatch, mutual ratings)
- [x] P3 — Money (wallet, double-entry ledger, Paystack, commission 20%, cancellation penalties, idempotency)
- [x] P4 — Engagement (gamification, scores, badges, leaderboard, commission reductions, referrals, subscriptions)
- [x] P5 — Ride Variants (carpooling NIN-gated + cost-split, shuttle fixed routes + seat inventory)
- [x] P6 — Safety & Comms (notifications via BullMQ, panic SMS, share-trip, in-ride chat, masked calls)
- [ ] P7 — Hardening (a11y, offline, error states, perf, e2e Maestro, store builds)

## Rider App Progress

- [x] P0 — Scaffold (Expo SDK 54, expo-router, NativeWind, @kari/mobile-core)
- [x] P1 — Auth + Onboarding (signup, SMS/WhatsApp OTP, additional info, liveness, preferences, login, forgot-password, Google SSO)
- [x] P2 — Ride Flow (home dashboard, booking, ride class selection, fare negotiation, real-time tracking, rate driver)
- [x] P3 — Wallet & Payments (`wallet.tsx` — consume backend wallet, card tokenization, payment method selector)
- [x] P4 — Engagement (`rewards.tsx`, `subscriptions.tsx` — referrals, view/manage subscription plans)
- [x] P5 — Ride Variants (`carpools.tsx`, `carpool/`, `shuttle.tsx`, `verify-nin.tsx` — carpool join flow + NIN gate, shuttle booking)
- [x] P6 — Safety & Comms (`safety.tsx`, `chat/`, `notifications.tsx`, `support.tsx` — panic, share-trip, in-ride chat, notifications, support ticket)
- [ ] P7 — Hardening (a11y, offline/empty/error polish, perf, e2e Maestro, EAS store builds)

> P0-P2 device-verified via Expo Go. P3-P6 committed (`61db90e`, `0336665`) but not yet device/runtime-verified.

## Driver App Progress

- [x] P0 — Scaffold (Expo SDK 54, @kari/mobile-core, 3-way gate, foundation stores)
- [x] P1 — Auth + KYC (signup + OTP, 6-step KYC wizard: personal/quiz/vehicle/NIN/liveness/payout)
- [x] P2 — Ride Flow (go online/offline, dispatch brain, incoming request sheet, active ride lifecycle, swipe-to-accept, background location scaffolded)
- [x] P3 — Earnings & Wallet (`earnings.tsx` — consume backend wallet, earnings dashboard, commission visibility)
- [x] P4 — Gamification (`rewards.tsx` — scores, badges, leaderboard display)
- [x] P5 — Ride Variants (`carpool.tsx`, `shuttle.tsx` — carpool driver flow, shuttle driver assignments)
- [x] P6 — Safety & Comms (`safety.tsx`, `chat/`, `notifications.tsx`, `support.tsx` — panic response, in-ride chat, notifications, support ticket)
- [ ] P7 — Hardening (a11y, offline/empty/error polish, battery/perf for background location, e2e Maestro, EAS store builds)

> P0-P2 device-verified. P3-P6 committed (`546d344`, `13080a5`) but not yet device/runtime-verified.

## Admin Progress

- [x] A0 — Scaffold (Next.js 15, dark theme, RBAC from @kari/types, httpOnly cookie auth, same-origin proxy)
- [x] A1 — Read-Only Ops (dashboard KPIs, users table + search, trips history + status filter)
- [x] A2 — Live Rides (`live/page.tsx` — fleet map, active trips)
- [~] A3 — Actions, Audit & Settings — audit log viewer (`audit/page.tsx`) ✅, settings + RBAC matrix view (`settings/page.tsx`) ✅, **Admins & Roles management page (`admins/page.tsx`) still a `ComingSoon` stub** ⚠️
- [x] A4 — Dedicated Drivers (`dedicated-drivers/page.tsx` — roster + onboard)
- [x] A5 — Tickets (`tickets/page.tsx` + in-app submit from rider/driver `support.tsx`; multi-source: app/web/email)
- [x] A6 — Financials (`revenue/`, `payouts/`, `promotions/`, `fare-config/` pages)

> A0-A1 build-verified (login works with seeded admin). A2-A6 committed (`3a76241` backend, `a2f99ef` app, `0fb6864` app-submit) but not yet runtime-verified. **Only remaining admin work: the Admins & Roles management page.**

---

## Decisions Made During Build

- **Monorepo tool:** pnpm 11 + Turborepo. `nodeLinker: hoisted` in pnpm-workspace.yaml (required for Expo/NativeWind). Dependency build-script approvals in `pnpm-workspace.yaml` under `allowBuilds:`.
- **Auth:** Self-issued JWT, dropped AWS Cognito. Refresh token rotation. Google OAuth via `google-auth-library` (dev fallback: decode-without-verify when `GOOGLE_OAUTH_CLIENT_IDS` unset).
- **Database columns:** camelCase (TypeScript convention), not snake_case.
- **Money units:** Kobo (minor units) in all ledger/wallet amounts. Ride fares in whole naira, multiplied x100 at boundary.
- **Commission:** Base 20% BPS, reduced by leaderboard standing (top 3 = -1%).
- **Personality quiz:** Changed from 3-point to 1-5 Likert scale per user feedback. Backend `scorePersonality`: <2.34=RESERVED, <3.67=NEUTRAL, else TALKATIVE.
- **Rider onboarding:** Redesigned to match Figma ("Kari Mobile App" file). Signup draft uses transient `signup.store` so channel is chosen before OTP is sent.
- **Socket dispatch:** Targeted rooms (ride:{id}, driver:{id}), not broadcast. Redis adapter for horizontal scale.
- **Provider noop pattern:** All providers have keyless test implementations that auto-succeed. SMS/WhatsApp noops log OTP to backend console.
- **Admin auth:** httpOnly cookie + same-origin proxy. Token never exposed to client JS. Zoho SSO stubbed.
- **NativeWind sharing:** `@kari/mobile-core` is source-shipped (no build step). Expo apps transform its source via Metro/Babel. Each app's `tailwind.config.js` uses the shared preset.
- **One active ride:** Backend enforces `POST /rides` returns 409 if rider already has an active ride.
- **Driver background location:** Foreground tracker with `expo-task-manager` background task. Falls back to foreground-watch in Expo Go. True background needs EAS dev build.
- **Ride view enrichment:** `RidesService.view()` is async and attaches counterparty summary (rider sees driver name/vehicle/rating; driver sees rider name/rating).
- **Money settlement (P3):** Settlement is synchronous + idempotent (`ride_{id}`). **CASH** → platform collects commission *from the driver* (driver wallet may go negative). **WALLET/CARD** → rider charged full fare, driver paid net, platform keeps commission. Two system wallets: `REVENUE` and `GATEWAY` (contra for money in transit). Global invariant asserted by E2E: Σ(all wallet balances) = 0.
- **Subscriptions (P4):** Static plan catalog. "Same-driver" stickiness — first driver to serve an active subscriber is captured as `assignedDriverId`; matching then dispatches exclusively to that driver when online/eligible.
- **Ride variants (P5):** Carpool is NIN-gated on both create and join; cost-split recomputes on join/leave (alone ⇒ full fare). Shuttle routes/stops/trips (Lekki + Aba) seeded on boot. Both use `@VersionColumn` seat guards.
- **Safety/Comms (P6):** Notifications is the first real BullMQ queue + `@Processor`. Share-trip returns a public `@Public` token (12h TTL) that **never** exposes the start PIN or rider PII. Chat + masked calls gated to the two ride participants. `EmailProvider` + `VoiceProvider` contracts added (noop only).
- **Admin A2-A6:** Live fleet map, audit interceptor + viewer, actions (suspend/verify/override), dedicated-driver roster, multi-source tickets, and financials (revenue/payouts/promos/fare-config) all built. **Admins & Roles management page intentionally left as a `ComingSoon` stub** (RBAC matrix is viewable in Settings; invite/assign-role actions not yet built).
- **Web:** Single-page marketing site — `page.tsx` composes 8 section components (Nav/Hero/Why/Steps/RideOptions/Testimonials/Faq/Footer) on its own **light** design system (`web/src/styles/tokens.css`, self-hosted variable fonts). Static (no backend) by design.

---

## Known Issues / Open Gaps

**Verification debt (highest priority for P7):**
- Mobile P3-P6 (rider + driver) and admin A2-A6 are **code-complete and committed but not runtime/device-verified**. Only P0-P2 (mobile) and A0-A1 (admin) have been exercised end-to-end. Treat the newer phases as "built, unverified" until a session confirms them on device / against a running backend.

**Ride-flow vision gaps (target spec: project-overview.md → Ride Flows; contract: architecture.md → Ride Type Matrix):**
- **Carpool:** built today as "create a carpool from a quote, members join, **equal fare-split**." Vision: a freelance **carpool-mode** toggle, **incremental en-route dispatch** (1–3 riders, each with their **own PIN**), **route optimization** (fuel/distance/time on pickups *and* dropoffs), and a **discounted ride-share** fare (each rider pays their own discounted fare, full if they ride alone). Payment: wallet → saved-card fallback.
- **Shuttle:** built today as **pre-book a seat** on a seeded trip. Vision: **hop the next bus on the matched route + QR scan** on entry/exit (charged by distance between stops), routes explorable via **search/filter by route + timing**, **wallet-only**. Ops assigns **dedicated driver → bus → route** via the admin app.
- **Subscription:** built today as a **static plan catalog** (Weekly Lite / Monthly Commute / Monthly Unlimited) + sticky-driver capture. Vision: **per-route monthly pricing** (e.g. ₦50k from route config), a **scheduled dispatch job** ahead of each set time, the **dedicated-sticky → dedicated → freelance** fallback chain, **frequency + one-way/two-way + set-time** config, driver arrives **5–10 min early**, rides **free at point of use**.
- **Solo:** largely aligned — freelance-only, standard 3-tier vs negotiate (tier-agnostic, no floor), **PIN minted on accept** ✓. No known gap.

**Unbuilt / stubbed:**
- Admin **Admins & Roles** management page (`admins/page.tsx`) is a `ComingSoon` stub — invite-admin / assign-role actions not implemented (RBAC matrix is view-only in Settings).
- **Web** is a static marketing landing page only — no product surface, no API integration.
- **Only Paystack has a real provider impl.** All 9 others are **noop-only** (Identity/NIN·Dojah, Liveness·Rekognition, SMS·Termii, WhatsApp·Twilio, Storage·S3, Maps·Google, Voice·Twilio, Push·Expo/FCM, Email·**AWS SES**) — even with credentials set they return noop until built. Pre-production requirement. (Push: Expo-vs-FCM decision still pending; Email: transactional only, marketing is separate/roadmap.)

**Security hardening (P7):**
- **scrypt cost params:** `password.service.ts` uses Node's default cost (N=2¹⁴). Raise to current OWASP guidance (N ≥ 2¹⁷, r=8, p=1). scrypt is the agreed algorithm (not Argon2id) — this is a parameter bump, not a rewrite.

**Design-token compliance:** ✓ **Resolved (both apps).** Rider splash and driver (`index.tsx` wordmark, tab labels, `SwipeToAccept`) no longer reference the unloaded `Poppins_*`; both use `ArchivoExpanded` (wordmark) + `HankenGrotesk_*` (text). `grep Poppins` is clean across `rider/` and `driver/`. Repo complies with design-tokens.md.

**Environment / tooling:**
- Google SSO needs the user's own OAuth client IDs in `app.json` (`extra.googleWebClientId`/`googleIosClientId`)
- EAS dev build is a user step (needs Expo account): `cd driver && eas login && eas build --profile development --platform ios` — required for driver background location + push
- Admin `next build` must not run while `next dev` is running (shared `.next` dir)

**Not bugs (documented to avoid re-investigation):**
- Figma frames scoped OUT: standalone Chat, multi-screen Payment, light-themed Account redesign
- Pricing formula (`base + ₦120/km + ₦15/min`) yields absurd fares for test locations outside Nigeria — correct math, wrong test location

---

## Verification History

**Backend (E2E-verified):**
- P0-P2: curl smoke tests; P2 ride loop verified 29/29 via self-contained E2E simulator (`/tmp/kari-p2-e2e.mjs`)
- P3 Money: ledger invariant Σ(balances)=0 asserted by E2E
- P4 Engagement: verified a leaderboard-leading driver's next ride settles at 19% (commission reduction)
- P5 Ride variants: E2E 23/23 (incl. ledger invariant)
- P6 Safety & Comms: E2E 20/20 (device register, contacts CRUD, participant-gated chat, masked call, public share with PIN hidden, panic)

**Mobile (device-verified):**
- Rider P0-P2: Verified on device via Expo Go (standard + negotiated fares end-to-end)
- Driver P0-P2: Verified on device, iOS bundle compiles ~10.5 MB, dispatch→ride flow verified

**Admin (build-verified):**
- A0-A1: Build-verified, login works with `admin@kari.test` / `AdminPass123!`

**Not yet verified (built but unexercised):**
- Rider P3-P6, Driver P3-P6 — committed, no device/runtime pass yet
- Admin A2-A6 — committed, no runtime pass yet
