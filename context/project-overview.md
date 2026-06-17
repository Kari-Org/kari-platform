# Project Overview

> The product story and the "why." For the full technical picture see [architecture.md](architecture.md);
> for what's built vs. pending see [progress-tracker.md](progress-tracker.md). This file is vision first,
> grounding second.

---

## What Kari Is

Kari is an Uber-like ride-hailing platform built for **Nigeria's socio-economic realities**. It is four
products around one backend:

- **Rider app** — passengers book, negotiate, track, pay, and stay safe.
- **Driver app** — freelance and dedicated drivers onboard, go online, get dispatched, and earn.
- **Admin console** — Kari ops manage drivers, riders, trips, tickets, and money in one place.
- **Marketing web** — the public-facing site.

It does everything the established ride-hailing apps do — and then leans into a handful of ideas that are
specifically tuned for the Nigerian market.

---

## What Makes Kari Different

1. **Dedicated drivers.** Alongside freelance drivers who self-onboard through the app, Kari employs
   **dedicated drivers** — directly hired, trained, and managed by Kari (salaried). They can be reserved
   for subscription routes, and shuttle drivers are dedicated drivers who drive buses instead of sedans.

2. **Subscribed routes.** For a regular trip (e.g. home↔work), a rider pays a **weekly/monthly
   subscription** instead of booking each morning. This guarantees pickup and drop-off at the rider's
   chosen time, removes the daily uncertainty of finding a driver, and shields them from surge pricing
   driven by traffic and fuel. Subscriptions assign a **sticky driver** — the same driver each time, for
   trust.

3. **Control over pricing — standard *and* negotiate.** Kari blends two pricing models: **standard**
   (accept the quoted fare) and **negotiate** (the rider names their own price with no floor; the driver
   can counter, capped at the standard fare). Riders pick per ride.

4. **Kari Shuttle.** Buses run **fixed, familiar routes** (Lekki / Aba corridors) with designated stops
   and per-stop fares, picking up and dropping off Kari customers along the way. Shuttle drivers are
   dedicated drivers in buses.

5. **Personality-matched drivers.** Riders state the kind of driver they want; drivers take a
   **personality quiz** (talkative / reserved / neutral), and matching factors it in — so a rider who
   wants a quiet trip is more likely to get one.

6. **A safety suite, not bolt-ons.** Ride-start **PIN** (the driver must enter the rider's PIN to begin
   the trip), one-tap **panic** (SOS SMS to emergency contacts), public **live trip-sharing** links, and
   **masked calls** (driver and rider talk without seeing each other's number).

7. **Gamified driver economics.** Drivers earn points and badges and climb a **weekly leaderboard**, and
   standing translates into **real money** — top drivers pay lower commission (e.g. top-3 pay 19% instead
   of the 20% base). Incentives are wired to earnings, not vanity metrics.

8. **A wallet that works when banks don't.** An in-app **double-entry wallet** riders and drivers top up
   and pay from — designed as a fallback for the common Nigerian case of bank apps or transfers failing
   mid-transaction.

9. **Spotify / music sharing.** *(Roadmap — not yet built.)* The vision: a rider connects their Spotify
   account and shares playlists with the driver in-app. **Today** the app ships a music-preference setting
   (own playlist / driver's choice / silence), a driver "Spotify installed" attestation, and a manual
   "paste your Spotify link" share on the ride screen. **Full account integration is post-MVP.**

*(Also built, supporting the above: carpooling with NIN-gated cost-splitting, referrals, and mutual
driver↔rider ratings.)*

---

## How It Works (user stories)

### Rider
Signs up with a phone number (OTP via **SMS or WhatsApp**), adds their details and an optional **NIN**,
passes a **selfie liveness** check, and answers a short ride-preferences survey (driver vibe, music,
accessibility). On the home screen they enter a destination, pick a **ride type** (solo / carpool /
shuttle) and **class** (Economy / Comfort / Premium), and get a fare quote — which they either **accept**
or **negotiate**. Once matched, they watch the driver approach on the map, **share a start PIN** to begin,
track the trip live (and can share it or hit **panic**), then pay by **wallet, card, or cash** and rate
the driver.

### Driver (freelance)
Signs up and completes a **gated KYC wizard** — personal info, personality quiz, vehicle, NIN,
face-liveness, and payout + next-of-kin. Only after passing can they **go online**. Online, dispatched
requests arrive as a **countdown bottom-sheet**; the driver **accepts or counter-offers**, navigates to
pickup, enters the rider's **PIN** to start, completes the trip, and watches **earnings, leaderboard
standing, and commission** update.

### Driver (dedicated)
Onboarded and managed by Kari ops **through the admin console** (not in-app self-signup); salaried; can be
**reserved for subscription routes**. **Shuttle drivers** are dedicated drivers assigned to fixed bus
routes.

### Admin / Operations
Kari staff sign in to a **role-gated** console to: watch a **live fleet map**, manage **rider/driver
lifecycles and KYC verification**, **override or resolve** trips and disputes, **onboard dedicated
drivers**, work a **multi-source support-ticket inbox** (app / web / email), and oversee **financials**
(revenue, payouts, promotions, fare config). Every admin action is **permission-checked and
audit-logged**.

---

## Ride Flows (by type)

The four ride types, rider + driver perspective. This is the **target spec** — items marked *(gap)* are
not built yet or are built differently today; the gaps are tracked in
[progress-tracker.md](progress-tracker.md), and the per-type contract is in
[architecture.md](architecture.md) → Ride Type Matrix.

### 1. Solo — freelance drivers only (for now)
**Rider:** Ride tab (or "Solo" on Home, which opens the Ride tab) → enter destination; pickup is
prefilled but editable, with autocomplete → confirm addresses → choose a pricing method:
- **Standard** → the 3-tier car screen (Economy / Comfort / Premium) → send the request at the quoted fare.
- **Negotiate** → name a price (**no floor**). A too-low price warns "you may not get a response" but can
  still be sent. **Tier-agnostic** — no car class is chosen on the negotiate path.

**Driver:** a freelance driver accepts (standard) or returns a **counter-price** (negotiate); the rider
accepts/rejects the counter.

**Start PIN** is generated **only when a driver accepts** (✓ matches code), shown to the rider, and
entered by the driver at pickup to start the trip.

### 2. Carpool — freelance, opt-in, 1–3 riders
**Rider:** picks Carpool on Home → pickup + dropoff (**NIN verification** required if not done at setup) →
**standard pricing only**. Paired with other riders heading a **similar route/radius** — not necessarily
the same pickup/dropoff.

**Driver:** after going online, toggles **"accept carpool requests"** (carpool mode) *(gap)*. Carries
**1–3 riders** at once (min 1). Accepts request 1 → rider 1 gets a PIN, driver heads to pickup; while en
route, a compatible request 2 may be offered → rider 2 gets their **own** PIN *(gap)*. The driver enters
**each rider's PIN at their pickup**. Pickup **and** dropoff order is **optimized for fuel / distance /
time** — adding a rider can reorder the route *(gap)*.

**Pricing:** **discounted ride-share** — each rider pays their **own discounted fare** (full fare if they
end up riding alone), **not** an equal split *(gap — current build splits one fare equally)*. Paid by
**wallet, falling back to the saved card** when the wallet is short. No cash.

### 3. Shuttle — dedicated drivers on fixed routes
**Rider:** explores routes ahead of time (**search/filter by route + timing**) → picks Shuttle, enters
pickup + dropoff → matched to the nearest route by the closest bus stop to pickup. **Wallet must be
funded.** Boards by **scanning a QR on the front of the bus** to mark entry, scans again on exit → charged
for the distance between the board and alight stops. **QR replaces seat reservation** *(gap)*.

**Driver:** a **dedicated** driver, assigned a **bus + route** by operations **via the admin web app** *(gap)*.

### 4. Subscription — sticky dedicated driver, with fallback
**Rider:** pays a **monthly fee priced per route** (e.g. ₦50,000, from the route's config) → sets
home/work, **frequency** (Mon–Fri, Sat–Thurs, …), **time(s)**, and **one-way or two-way** (e.g. two-way:
home 07:00 → work 17:30). On the set days the rider is **not charged at ride time** — the month covers it.

**Driver:** a **scheduled job** fires ahead of each set time *(gap)* → assigns the **sticky dedicated**
driver; if unavailable → another **dedicated** driver; if none → dispatches a **request to nearby
freelance** drivers. The driver arrives **5–10 minutes early**.

### Cross-cutting rules
- **Driver eligibility:** Solo = freelance · Carpool = freelance (opt-in) · Shuttle = dedicated (assigned)
  · Subscription = dedicated-sticky → dedicated → freelance fallback.
- **Start PIN:** minted on driver accept; carpool issues **one PIN per rider**.
- **Pricing method:** Standard vs Negotiate applies to **Solo only**; Carpool/Shuttle/Subscription are
  standard or fixed. Negotiate never picks a car tier.
- **Payment by type:** Solo = wallet / card / cash · Carpool = wallet → saved-card fallback · Shuttle =
  **wallet only** · Subscription = prepaid monthly (free at point of use).

---

## Built for Nigeria

- **Pricing reflects local economics** — fare math factors **fuel and traffic**, not just distance and time.
- **Phone-first identity** — phone + OTP (SMS via Termii, or WhatsApp) and Google sign-in; **no
  email/password** for riders and drivers.
- **NIN-based trust** — KYC via NIN verification, required for drivers and for carpool participation.
- **Money in naira/kobo**, with a wallet that doubles as a **fallback when bank apps fail**.
- **Nigeria-scoped maps and places** throughout.

---

# Technical Grounding (the trailer)

A quick orientation — [architecture.md](architecture.md) has the full detail, and
[progress-tracker.md](progress-tracker.md) has live status.

Kari is a **monorepo, TypeScript end-to-end**, consolidating **8 legacy repositories** (dual backends
NestJS + Java, dual mobile stacks RN + Flutter, plus separate web and admin) into one codebase. The legacy
split was a hiring artifact (different contractors), not a design choice.

### Products

| Product | Path | Tech | Purpose |
|---------|------|------|---------|
| Backend | `backend/` | NestJS 11, PostgreSQL 16, Redis 7 | Unified API + WebSocket server |
| Rider App | `rider/` | Expo SDK 54, React Native 0.81 | Passenger mobile app |
| Driver App | `driver/` | Expo SDK 54, React Native 0.81 | Driver mobile app |
| Admin Dashboard | `admin/` | Next.js 15, App Router | Operations console |
| Web | `web/` | Next.js 15 (light theme) | Single-page marketing site (8 sections) |
| Shared Types | `packages/types/` | TypeScript | Enums, API contracts, RBAC |
| Mobile Core | `packages/mobile-core/` | TypeScript + NativeWind | Shared mobile UI + API client + socket |
| Brand | `brand/` | Static assets | Logo, icons, fonts, design kit |

### Build status at a glance
- **Backend:** P0–P6 done; **P7 (hardening)** is the only phase left.
- **Rider + Driver apps:** P0–P6 done (P0–P2 device-verified, P3–P6 committed but **not yet runtime-verified**); P7 left.
- **Admin:** A0–A6 done **except** the *Admins & Roles* management page (a stub).
- **Web:** built single-page marketing site (8 sections, its own light design system); not backend-wired (by design).

→ Full breakdown, verification history, and known gaps live in [progress-tracker.md](progress-tracker.md).

### Key domain concepts (the vocabulary)
- **Driver types:** `FREELANCE` (self-onboarded) vs `DEDICATED` (admin-onboarded, salaried).
- **Ride types:** `SOLO`, `CARPOOL` (NIN-gated, cost-split), `SHUTTLE` (fixed routes), `SUBSCRIPTION` (sticky driver).
- **Price types:** `STANDARD` (accept quote) vs `NEGOTIATE` (rider proposes, driver counters).
- **Car classes:** `ECONOMY`, `COMFORT`, `PREMIUM` (tiered pricing).
- **Driver personality:** `TALKATIVE` / `RESERVED` / `NEUTRAL` (Likert quiz, 1–5).
- **KYC gating:** drivers must complete KYC before going online; NIN required for carpooling.
- **Double-entry ledger:** every wallet change posts balanced debit/credit legs; Σ(all wallets) = 0.
- **Kobo units:** money is minor units (kobo) internally; naira shown to users.
- **Optimistic locking:** `@VersionColumn` on Ride / Carpool / ShuttleTrip — first concurrent actor wins.

### Out of scope (current phase)
Autonomous vehicles · multi-country (Nigeria only) · email/password auth (phone + OTP + Google only) ·
crypto payments · third-party delivery/logistics · an in-app driver-training product (dedicated-driver
training is an ops process) · scheduled rides · multiple active rides per rider (enforced: one at a time).

### Current priorities
- **P7 hardening** across backend + both mobile apps (a11y, offline, error states, perf, e2e, store builds).
- **Runtime-verify** the built-but-unverified phases (mobile P3–P6, admin A2–A6).
- Build the admin **Admins & Roles** management page.
- Build out the **web** marketing/product site.
- Swap in **real provider implementations** (push, email, WhatsApp in the notification fan-out).

### Roadmap (post-MVP)
Full **Spotify** account integration + playlist sharing · "Kari Wrapped" · watchlist address + push ·
emergency car-alarm integration · **Fare-split with friends** (an in-app friendship/social graph — a
booker selects known people to split one ride's fare, auto-charging their accounts; distinct from
carpool) · **Marketing email** (a separate bulk/campaign capability — lists, templates, unsubscribe —
distinct from the transactional `EmailProvider`). Tracked, not built in MVP.
