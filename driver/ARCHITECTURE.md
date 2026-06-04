# Kari Driver App — Architecture & Design

> **Status:** Draft v1 · **Date:** 2026-06-03 · **Stack:** Expo (React Native) + TypeScript
> The single source of truth for the unified driver app. It supersedes the two legacy driver apps
> (`KariDriverMobile` / Expo-RN auth-funnel scaffold, `KariDriverMobileFlutter` / Flutter full-UI
> prototype), taking the **rider app's proven architecture** (see `../rider/ARCHITECTURE.md`), the
> Flutter app's **screen flows + design polish**, and wiring both to the live backend
> (`../backend/ARCHITECTURE.md`) over typed `@kari/types` contracts.

---

## 1. Purpose & Goals

The driver-facing mobile app for Kari (Nigeria ride-sharing). Drivers sign up, complete a gated **KYC
onboarding** (personal info, personality quiz, vehicle, payout + next-of-kin, NIN, face-liveness), go
**online**, receive **dispatched ride requests in real time**, accept or **counter-offer** (negotiation),
navigate to pickup, **start with the rider's PIN**, complete the trip, get rated, and track **earnings**.

Both legacy driver apps are throwaway as architecture: the RN app is an auth-funnel scaffold, and the
Flutter app draws the whole journey but is **100% mocked** (no backend, auth, realtime, location, or
uploads — and was visibly forked from the rider app). This rebuild is the one driver app that runs on
real data, against a backend that **already implements the driver side** (onboarding, KYC gate,
availability, Redis-GEO matching, full ride lifecycle, sockets).

Goals, in priority order:
1. **Real data, end to end** — every screen backed by the live API; no mocks in shipped flows.
2. **One stack, shared contracts** — TypeScript + `@kari/types`; identical foundation to the rider app.
3. **Live by default** — dispatch and ride state over the WebSocket gateway, not polling.
4. **Location is the product** — reliable **foreground + background** location streaming while online/on-trip.
5. **KYC-gated** — no driver reaches "online" without completing onboarding + passing NIN + liveness.
6. **Buildable in phases that track the backend** — each driver phase consumes the matching API phase.

---

## 2. Lineage — What We Carry Forward

| Concern | Legacy RN (`KariDriverMobile`) | Legacy Flutter (`KariDriverMobileFlutter`) | **Decision** |
|---|---|---|---|
| Maturity | auth funnel only (splash→signup→OTP→stub) | full UI, all mocked | **architecture from neither** |
| Stack | Expo SDK 52 / expo-router / TS | Flutter / Provider | **Expo SDK 54 / expo-router / TS** (match rider) |
| State | Context only | Provider (2 stubs) | **Zustand (domain stores) + TanStack Query** |
| Auth | dual Cognito + backend (broken) | none | **backend JWT + expo-secure-store** |
| Realtime | none | none (faked dispatch card) | **socket.io-client → gateway** |
| Maps/location | libs unused | google_maps render only, no GPS | **react-native-maps + expo-location (fg+bg)** |
| **Best to mine** | design language, auth funnel | **7-step KYC wizard, 8-Q driver quiz, ride-flow screens, account list, in-ride chat** | **flows + design from Flutter** |

**Net:** the rider app's architecture (which we just built and verified) + the Flutter app's driver
flows & design polish, all on real data — plus the one thing neither legacy app had: **background
location**.

---

## 3. Technology Stack

Identical foundation to the rider app (so the two apps share patterns and `@kari/types`), with
driver-specific additions in **bold**.

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Expo SDK 54, RN 0.81, React 19, New Arch | Match rider; OTA + EAS |
| Language | TypeScript (strict) | Shared `@kari/types` |
| Navigation | Expo Router v6 | Typed routes, groups, gating |
| Styling | NativeWind v4 + Tailwind | Same tokenized design system as rider |
| Fonts | Poppins | Brand type |
| Client state | Zustand | `auth` / `availability` / `ride` stores |
| Server state | TanStack Query | Caching, mutations, optimistic ride actions |
| API client | thin typed `fetch` wrapper | Envelope unwrap + Bearer + 401 refresh (reuse rider's) |
| Realtime | `socket.io-client` | **Dispatch** + ride events (JWT on connect) |
| Maps | `react-native-maps` (Google) | Navigation map, dark style, polyline |
| Location | `expo-location` **+ `expo-task-manager`** | **Background location task** while online/on-trip |
| Camera | **`expo-camera`** | Liveness capture + document/vehicle photos |
| Media pick | **`expo-image-picker`** | License/NIN/vehicle uploads |
| Secure storage | `expo-secure-store` | Tokens |
| Cache storage | `@react-native-async-storage/async-storage` | Non-sensitive cache |
| OTP UI | `react-native-otp-entry` | Signup OTP + ride start-PIN entry |
| Bottom sheet | `@gorhom/bottom-sheet` | Incoming-request + active-ride sheets |
| Animation | `react-native-reanimated` + `gesture-handler` | Wave header, sheets, car-progress |
| Audio/Haptics | **`expo-av` / `expo-haptics`** | **Dispatch alert sound + vibration** (a driver must not miss a request) |
| Push | **`expo-notifications`** | **Wake the app for dispatch when backgrounded** (later phase) |
| Shared types | `@kari/types` | One contract for both ends |
| Build/deploy | **EAS dev build** + Update | **Background location & push need a custom dev client — Expo Go can't run them** |

> **Key constraint:** unlike the rider app (fully testable in Expo Go), the driver app's core feature —
> **background location** (and later push) — **does not run in Expo Go**. The driver app needs an **EAS
> development build** installed on the device. Foreground-only flows (onboarding, online toggle while app
> is open) can still be exercised in Expo Go during early phases.

---

## 4. Architectural Principles

Same nine as the rider app, plus driver specifics:
1. **Server state ≠ client state.** TanStack Query owns API data; Zustand owns session/UI (tokens, online flag, active ride id).
2. **One typed API client** — Bearer + envelope unwrap + single-flight 401 refresh. Reuse the rider's client verbatim.
3. **Contracts come from `@kari/types`** — never re-declared.
4. **Real-time drives ride UI** — dispatch and state arrive over the socket; HTTP is the fallback.
5. **Tokens in the keychain** (`expo-secure-store`); secrets server-side.
6. **Dispatch is an interrupt, not a screen you navigate to.** A global socket listener surfaces the
   incoming-request overlay over whatever tab is active, with sound + haptics + a countdown.
7. **Location is a background service.** While `ONLINE` or `ON_TRIP`, a registered background task streams
   position to `/availability/location`; it stops on `OFFLINE`/ride-complete to save battery.
8. **Onboarding is a hard gate.** The app's authenticated shell is unreachable until
   `/drivers/onboarding/complete` succeeds (personal + vehicle + payout + NIN + liveness all done).
9. **Every screen has four states** — loading / empty / error / content. **Design tokens, not magic values. Feature-foldered.**

---

## 5. App Structure

```
driver/
├── app/                          # Expo Router routes (thin screens)
│   ├── _layout.tsx               # Providers, splash, 3-way auth+onboarding gate, global dispatch listener
│   ├── index.tsx                 # Redirect by auth/onboarding state
│   ├── (auth)/                   # welcome, signup, verify, otp, signin, success
│   ├── (onboarding)/             # KYC wizard: personal, quiz, vehicle, documents, liveness, payout, review
│   ├── (app)/(tabs)/             # home (online toggle + map), trips, account
│   ├── request/[id].tsx          # incoming-request overlay (accept / reject / counter-offer)
│   └── trip/[id].tsx             # active ride: to-pickup → arrived → start-PIN → in-progress → complete → rate
├── src/
│   ├── api/                      # typed client (shared w/ rider), endpoints, query hooks
│   ├── stores/                   # auth.store, availability.store, ride.store (Zustand)
│   ├── realtime/                 # socket client + dispatch/ride-event hooks
│   ├── location/                 # background task (expo-task-manager), tracker start/stop
│   ├── features/                 # auth/ onboarding/ dispatch/ trip/ earnings/ account/
│   ├── components/               # shared UI (Button, Input, Screen, Sheet, MapView, OnlineToggle, …)
│   ├── theme/                    # tokens, tailwind preset, dark map style
│   └── lib/                      # env, storage, formatting, geo helpers
└── assets/                       # fonts, images, icons, dispatch sound
```

> **Code sharing:** the api client, socket layer, theme tokens, and several primitives are near-identical
> to the rider app. **Open decision (§15):** extract a shared `@kari/mobile-core` workspace package vs.
> copy-and-adapt per app.

---

## 6. Navigation Architecture

- **Expo Router**, groups: `(auth)`, `(onboarding)`, `(app)/(tabs)`, plus top-level `request/[id]` and `trip/[id]`.
- **Three-way gate** in the root layout: unauthenticated → `(auth)`; authenticated but
  `!onboardingComplete` → `(onboarding)`; ready → `(app)/(tabs)/home`.
- **Tabs**: Home · Trips · Account — dark + yellow dot tab bar (Flutter parity).
- **Onboarding** is a linear gated stack (each step persists to its backend endpoint; progress resumes).
- **Dispatch** (`request/[id]`) is presented **modally over the tabs** by the global listener on `ride:offer`.
- **Active trip** (`trip/[id]`) is a full-screen flow pushed on accept; it owns the navigate→arrive→start→complete states.

---

## 7. State Management

**Client (Zustand):**
- `useAuthStore` — `{ accessToken, refreshToken, user, status }`; tokens from secure-store.
- `useAvailabilityStore` — `{ online, lastFix, watching }`; drives the online toggle + background tracker.
- `useRideStore` — `{ activeRideId, incomingOffer }`; the in-flight dispatch/trip.

**Server (TanStack Query):** driver profile (`/drivers/me`), onboarding state, trips (`/rides/mine`),
ride detail (`/rides/:id`), earnings (Phase 3). Ride actions are mutations with optimistic status;
socket events patch the relevant query cache so HTTP and realtime stay coherent.

---

## 8. Data Layer (backend surface this app consumes)

Typed `endpoints` module over the shared client; every shape from `@kari/types`.

- **Auth (shared):** `/auth/signup` (role DRIVER, `channel`), `/auth/send-otp`, `/auth/verify`, `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/google`.
- **Driver onboarding (`/drivers`):** `GET /me`; `POST onboarding/personal` · `onboarding/quiz` · `onboarding/vehicle` · `onboarding/details` (payout + next-of-kin) · `onboarding/nin` · `onboarding/liveness/session` + `onboarding/liveness/check` · `onboarding/complete` (gated).
- **Availability (`/availability`):** `POST online {lat,lng}` · `location {lat,lng}` · `offline`.
- **Rides (`/rides`) — driver actions:** `POST :id/accept` (STANDARD) · `:id/offer {amount}` (NEGOTIATE counter) · `:id/arrived` · `:id/start {otp}` · `:id/complete` · `:id/cancel {reason}` · `:id/rate {stars,comment}`; `GET /mine` · `GET /:id`.
- **Document upload:** confirm/extend a driver-facing upload route for license/NIN/vehicle photos (the `identity` module already has `uploadDocument` → S3 provider; no-op returns a URL in dev). *(P1 dependency.)*

---

## 9. Realtime

- `socket.io-client` connects with the access token; auto-joins `user:{id}`.
- **Driver subscribes to:** `ride:offer` (a dispatch — STANDARD or NEGOTIATE), `ride:accepted` (the rider
  accepted my counter-offer), `ride:cancelled` (rider cancelled). The driver is the **actor** for
  arrived/start/complete, so it drives those via HTTP and reflects them locally.
- A root-level `useDispatchChannel()` hook: on `ride:offer` → play sound + haptic, push `request/[id]`
  with a countdown; on `ride:accepted` → go to `trip/[id]`; on `ride:cancelled` → toast + return home.

---

## 10. Maps & Location (the defining driver concern)

- `react-native-maps` (Google) with the shared dark style; markers for pickup/dropoff/self; route polyline
  to pickup then to dropoff (decoded from the backend directions/quote).
- `expo-location` foreground for the online map + the current fix.
- **Background tracking**: an `expo-task-manager` task registered while `ONLINE`/`ON_TRIP` streams
  position to `POST /availability/location` (throttled, distance-filtered). Stops on `OFFLINE`/complete.
  Android needs a **foreground service** (notification); both platforms need "Always" permission — hence
  the **EAS dev build** requirement.
- Battery: adaptive interval (slower when idle-online, faster on-trip), distance filter, stop when offline.

---

## 11. Design System

Same tokens as the rider app (the two legacy apps already converged on this identity).

**Colors:** `brand #FFFF00` · `bg #070707` · `surface #121212` · `card #181818` · `border #2A2A2A` ·
`text #FFFFFF` · `muted #CBCBCB` · `subtle #888888` · `success #3BD17A` · `danger #FF5A5F`.
**Type:** Poppins (`display 28/700 · h1 24/700 · h2 20/600 · body 16/400 · caption 12/400`).
**Radii:** `pill 999 · input 30 · card 12`. **Spacing:** 4-pt scale.

**Core components** (reuse rider's where identical): `Screen`, `KariButton`, `InputField`, `PhoneInput`,
`OtpField`, `Select`, `Checkbox`, `SuccessBadge`, `StepDots`, `BrandMark`, `ScreenHeader` (back/cancel),
`DotTabBar`, `MapView`, `AddressAutocomplete`.

**Driver-specific components:** `OnlineToggle` (the big online/offline switch), `WaveHeader` (yellow
wave-clipped header — "Hi {name}", earnings), `IncomingRequestCard` (rider, fare, distance, **countdown
ring**, Accept / Reject / Counter), `CounterOfferSheet`, `CarProgress` (the navigate/in-progress
metaphor), `DocumentUploadTile` (pick/capture → upload → status), `LivenessCamera` (oval mask),
`EarningsCard`, `StarRating`, `StatCard`.

---

## 12. Screen Inventory (driver, union of legacy flows, on real data)

| Flow | Screens | Source |
|---|---|---|
| **Auth** | welcome (carousel) · signup · verify (SMS/WhatsApp) · otp · signin · success | RN funnel + rider parity |
| **Onboarding (KYC wizard, gated)** | personal info · **personality quiz (8-Q)** · driver/license + **NIN** · **liveness** (camera) · vehicle details + photos · next-of-kin + **payout** · review → complete | Flutter wizard → backend steps |
| **Home (online)** | wave header · **online/offline toggle** · today's earnings/stats · self on map | Flutter |
| **Dispatch** | **incoming-request overlay** (rider, pickup/dropoff, fare, **countdown**, Accept/Reject) · **counter-offer** (NEGOTIATE) | Flutter + new |
| **Active trip** | navigate-to-pickup (map+directions) · **arrived** · **start (enter rider PIN)** · in-progress · complete · **rate rider** | Flutter + new |
| **Trips** | history (completed/cancelled), trip detail | new |
| **Earnings** | balance, today/week, per-trip breakdown, payouts | Flutter (Phase 3) |
| **Account** | profile + rating · vehicle · documents · payout · preferences · safety · logout | both |
| **Comms/Safety** | in-ride chat · call · SOS/panic | Flutter (later) |

---

## 13. Cross-Cutting Concerns

- **Permissions** — location "Always" + camera + notifications, requested with clear rationale; graceful
  degraded states if denied (can't go online without location).
- **Battery** — adaptive location cadence; stop tracking offline; foreground-service notification on Android.
- **Don't-miss-a-dispatch** — sound + haptics + countdown; (P6) push wakes the app when backgrounded.
- **Env / errors / four-states / auth lifecycle / offline / a11y / i18n** — same policies as the rider app.

---

## 14. Requirements Traceability (driver-facing)

| Requirement (RSD v1.0) | Screen / module |
|---|---|
| Freelance driver self-onboarding + KYC (docs, NIN, liveness) | Onboarding wizard |
| Driver personality/behavior profile (matching input) | Onboarding/quiz |
| Go online; receive dispatched requests near pickup | Home + Dispatch |
| Accept / reject; **negotiation counter-offer** (≤ standard fare) | Dispatch |
| OTP/PIN to start the ride | Active trip (start) |
| Navigate pickup → dropoff; complete | Active trip |
| Earnings, payouts, commission, cancellation penalties | Earnings (Phase 3) |
| Mutual ratings | Active trip (rate rider) |
| Emergency/panic; in-app chat & calls | Comms/Safety |
| Ride variants (carpool/shuttle) driver side | Dispatch/flows (Phase 5) |

---

## 15. Decisions Log

**Locked:**
1. Stack = Expo SDK 54 / RN / TS — identical foundation to the rider app; `@kari/types` contracts.
2. Design tokens = the shared dark + `#FFFF00` system; Poppins. Carry the Flutter flows + design.
3. Tokens in `expo-secure-store`; backend JWT auth (drop the legacy client-side Cognito entirely).
4. Onboarding is a hard gate on `/drivers/onboarding/complete`.
5. **Code sharing** — ✅ extract a shared **`@kari/mobile-core`** workspace package (typed API client +
   session/refresh, socket layer, theme tokens + Tailwind preset, shared primitives) consumed by **both**
   rider & driver. The rider app is repointed at it (its `theme`/`api`/`components` become thin re-exports)
   so there's one source of truth and no drift. *(Decided 2026-06-03.)*
6. **Device testing** — ✅ P0–P1 stay **Expo Go-testable** (foreground flows); the **EAS development build**
   is set up at **P2**, when background location + on-device dispatch land. *(Decided 2026-06-03.)*
7. **Driver app needs an EAS dev build for background location + push** — Expo Go covers foreground only
   (a constraint that surfaces at P2, per decision 6).

**Open (decide before the phase that needs them):**
8. **Document upload contract** — reuse `identity.uploadDocument` (S3) vs. add a dedicated driver upload route. (P1.)
9. **Dispatch when app is closed** — Expo Push vs. FCM data-message + foreground service. (P6; aligns with backend Phase 6.)

---

## 16. Build Plan (mirrors the backend & rider phases)

Each phase ships a testable slice and consumes the matching backend phase.

| Phase | Driver scope | Consumes API |
|---|---|---|
| **0 · Foundation** | Expo scaffold in monorepo (reuse rider setup), theme/tokens, nav + 3-way auth/onboarding gate, Zustand stores, typed API client + refresh, socket base, env, base components, splash + onboarding carousel, **background-location scaffolding (task + permissions)** | — |
| **1 · Identity & KYC onboarding** | signup → OTP → signin/refresh/logout; the gated **KYC wizard** (personal · quiz · vehicle + photos · documents/NIN · **liveness** camera · payout + NOK · complete) with upload + camera | Phase 1 |
| **2 · Core ride flow** | **go online/offline + live location streaming (fg+bg)**; receive `ride:offer` → **incoming-request card + countdown** → accept (STANDARD) / **counter-offer** (NEGOTIATE) → navigate to pickup → arrived → **start with rider PIN** → in-progress → complete → **rate rider**; trips history; account (read) | Phase 2 |
| **3 · Money** | earnings dashboard, wallet, payouts, commission view, cancellation penalties | Phase 3 |
| **4 · Engagement** | rewards/leaderboard, ratings detail, referrals | Phase 4 |
| **5 · Ride variants** | carpool / shuttle driver flows | Phase 5 |
| **6 · Safety & comms** | SOS/panic, in-app chat & calls, **push for dispatch when backgrounded** | Phase 6 |
| **7 · Hardening** | a11y, offline/empty/error polish, **battery/perf for background location**, e2e (Maestro), EAS store builds | Phase 7 |

*End of driver architecture draft v1. Build plan tracks the backend phases; this doc updates as decisions land.*
