# Progress Log

> **What this file governs:** the living record of what has actually been built and decided — newest
> first. For *why* see [foundation.md](foundation.md) (it wins on conflict); for what's buildable next
> see [build-graph.md](build-graph.md). This file replaced `progress-tracker.md` (2026-07-30); its
> verification history is preserved below.

## Standing instruction for the AI agent

**After completing any work in this project, before ending your response, prepend a progress entry
here.** This is mandatory — the same way reading the context files first is mandatory. Entry format:

```
### <category> · <area> · <short title> — YYYY-MM-DD
**What:** one line (itemize if one session produced several parts)
**Notes:** gotchas, limitations, follow-ups (omit if none)
```

Categories: `feature` / `fix` / `refactor` / `chore` / `decision` / `docs`.
Areas: `backend`, `rider`, `driver`, `admin`, `web`, `packages/*`, `db`, `infra`, `context`.

**The drift rule:** if an entry is a `decision` that changes anything in `foundation.md` or another
context file, update that file too (foundation first) and add a `docs` entry noting it. Context files
must never drift from what was decided.

---

## Entries

### feature · types+backend+admin · Shuttle v2: ops route assignment (spec 0002) — 2026-08-03
**What:** New `shuttle:assign` permission in `@kari/types` (OPS + SUPER_ADMIN); `shuttle_routes` gains
`assignedDriverId`/`busPlateNumber`/`busLabel`; `PATCH /admin/shuttle/routes/:id/assignment` (assign or
clear, DEDICATED+ACTIVE validation, one-driver-one-route 409, transactional stamping of future
SCHEDULED trips, audit-logged) + `GET /admin/shuttle/routes`; seeder now stamps new trips from the
route assignment; admin gets a Shuttle page (assign/clear, `<Can>` gated).
**Notes:** Runtime-verified 9/10 ACs incl. reseed inheritance via live-schema queries; admin page
browser pass pending per convention. ShuttleModule now exports ShuttleService (AdminModule imports it).
Part of the Graphify study.

### feature · backend+driver · Carpool v2: driver carpool-mode toggle (spec 0001) — 2026-08-03
**What:** `carpoolMode` on `driver_profiles`; `POST /availability/carpool-mode` (403 for dedicated);
`findCandidates` gains an `opts` eligibility filter (`requireCarpoolMode`, `driverType`) with a widened
GEO over-fetch window; carpool dispatch now targets only opted-in freelance drivers; driver home tab
gets the opt-in switch (freelance only, optimistic, hydrated from `/drivers/me`).
**Notes:** Runtime-verified AC-1–AC-6 against a live backend (dispatch counts observed); driver-app UI
device pass pending per convention. Also enforces the first piece of the ride-type-matrix eligibility
rule in code — solo dispatch still has no driverType filter (follow-up in spec 0001). Part of the
Graphify before/after study (docs/graphify-study/log.md).

### docs · context · Context system rebuilt around foundation.md — 2026-07-30
**What:** Derived `foundation.md` (v1, converged) from the codebase; added `build-graph.md` +
`progress-log.md`; retired `progress-tracker.md` (gaps → build-graph, history → below); repointed all
cross-references.
**Notes:** Build constraints confirmed with founder: solo, part-time, real venture (foundation §0, §3).

### fix · backend · Admins exempt from login OTP (2FA) — 2026-06-23
**What:** Admin email/password login no longer requires the OTP second factor (foundation §7 #7).

### feature · admin · Admins & Roles page — 2026-06-23
**What:** `admins/page.tsx` built: list admins, invite, change role, change status. Replaces the
long-standing ComingSoon stub — admin A0–A6 now fully built.
**Notes:** Not yet runtime-verified (see build-graph → verification).

### feature · rider · Pixel-perfect Figma redesign + negotiate mode + account tab — 2026-06-22
**What:** Full rider visual redesign to the *Kari Mobile App* Figma file (R0–R5): onboarding, app
screens, wallet tip flow, negotiate "name your price" mode (keyboard Done bar), account tab
(Figma 1443:6801) + settings sub-screens (addresses, language, music, personal-info, driver-type).
**Notes:** EAS dev-build config updated (app.config.js injects Maps key; eas.json env mapping).

### feature · backend · OTP on re-login (2FA) + longer-lived sessions — 2026-06-18
**What:** Re-login now requires OTP for riders/drivers; session TTLs lengthened. JSON body limit raised
for selfie/document uploads.

### docs · context · Cross-cutting + per-product context system — 2026-06-17
**What:** Added root `context/` docs and per-product `context/` folders (backend/rider/driver/admin/web).
**Notes:** Rider+driver dropped unloaded Poppins for ArchivoExpanded/HankenGrotesk (design-token
compliance resolved).

### chore · infra · Railway backend deploy + EAS build pipeline — 2026-06-08/09
**What:** Backend deployed to Railway (Dockerfile, DATABASE_URL, configurable Swagger with basic auth);
rider + driver linked to EAS projects (dev-client, EAS Update, preview-sim profile, Node pinned 22.13.1,
`@kari/types` built in eas-build-post-install); apps pointed at the Railway backend.

### feature · admin · A2–A6: live fleet, actions+audit, dedicated drivers, tickets, financials — 2026-06-05
**What:** Live fleet map, audit interceptor + viewer, admin actions (suspend/verify/override),
dedicated-driver roster + onboard, multi-source tickets (app/web/email; in-app submit from both mobile
apps), financials (revenue/payouts/promotions/fare-config).
**Notes:** Committed, not runtime-verified.

### feature · rider+driver · Mobile P3–P6: money, engagement, variants, safety & comms — 2026-06-05
**What:** Wallet/payments + earnings, gamification + subscriptions, carpool + shuttle + NIN gate,
safety (panic, share-trip) + chat + notifications + support — both apps.
**Notes:** Committed, not device-verified (P0–P2 were device-verified via Expo Go).

### feature · backend · P5–P6: ride variants + safety & comms — 2026-06-05
**What:** Carpooling (NIN-gated, cost-split, @VersionColumn), shuttle (Lekki/Aba routes seeded, seat
inventory); notifications via BullMQ, panic SMS, share-trip (public token, 12h TTL, PIN hidden), in-ride
chat, masked calls.
**Notes:** E2E: P5 23/23, P6 20/20 (incl. ledger invariant).

### feature · backend · P3–P4: money + engagement — 2026-06-04
**What:** Double-entry wallet/ledger (kobo, Σ=0), Paystack behind PaymentProvider, commission 20%
leaderboard-reduced, cancellation penalties, idempotent settlement; gamification (scores/badges/
leaderboard), referrals, subscriptions (static plans, sticky driver).
**Notes:** E2E-verified: ledger invariant asserted; leaderboard leader settles at 19%.

### feature · platform · P0–P2 + web + brand: foundation through core rides — 2026-06-04
**What:** Monorepo (pnpm+Turbo), `@kari/types`, backend P0–P2 (auth/OTP/Google, KYC, NIN/liveness,
matching via Redis GEO, tiered+traffic pricing, ride state machine, negotiation, start-PIN, socket
dispatch, mutual ratings), rider + driver P0–P2, admin A0–A1, marketing web (8 sections, light theme),
brand kit (Hanken/Archivo-Expanded/Geist).
**Notes:** Backend P2 verified 29/29 via E2E simulator; mobile P0–P2 device-verified; admin login
verified with seeded admin (`admin@kari.test`).

---

## Verification ledger (carried from progress-tracker.md)

**Verified:** backend P0–P6 (E2E: P2 29/29 · P3 ledger Σ=0 · P4 19% commission · P5 23/23 · P6 20/20) ·
rider P0–P2 (device, Expo Go) · driver P0–P2 (device; iOS bundle ~10.5 MB) · admin A0–A1 (build + login).
**Built, unverified:** rider P3–P6 · driver P3–P6 · admin A2–A6 + Admins & Roles · rider Figma redesign.
