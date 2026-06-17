# Kari Rider App — Architecture & Design

> **Status:** Draft v1 · **Date:** 2026-06-02 · **Reconciled with code:** 2026-06-08 · **Stack:** Expo (React Native) + TypeScript
> Design rationale + lineage for the unified rider app. It supersedes the two legacy rider apps
> (`KariRiderMobile` / Expo-RN, `KariRiderMobileFlutter` / Flutter), taking the RN app's stack +
> architecture and the Flutter app's design language + richer ride-flow screens, and wiring both to
> the backend (see `../../backend/context/ARCHITECTURE.md`) over typed `@kari/types` contracts.
>
> **As-built reconciliation (2026-06-08):** corrected where the code diverged — **HankenGrotesk** (not
> Poppins), and a **2-way auth gate** (onboarding is reached by explicit navigation, not root-gated). The
> as-built detail is in the sibling files: [README.md](README.md), [screen-catalog.md](screen-catalog.md),
> [stores.md](stores.md), [ui-registry.md](ui-registry.md). Several components and the "ride-flow stack" in
> §11–12 are the original design sketch — see screen-catalog.md / ui-registry.md for what's actually built.

---

## 1. Purpose & Goals

The rider-facing mobile app for Kari (Nigeria ride-sharing). Riders sign up, get verified, book rides
(solo / carpool / shuttle / subscription), negotiate fares, track drivers live, pay, rate, and stay
safe (start-PIN, panic, trip-sharing).

Both legacy rider apps are UI-complete but **never talked to a real backend**. This rebuild's job is
to be the one rider app that does — on the chosen stack, consuming the live API.

Goals, in priority order:
1. **Real data, end to end** — every screen backed by the Phase 0–2 API; no mocks in shipped flows.
2. **One stack, shared contracts** — TypeScript + `@kari/types`, so request/response shapes are typed once.
3. **Live by default** — real-time ride state over the WebSocket gateway, not polling.
4. **Trust & safety surfaced** — start-PIN, panic, trip-sharing are first-class screens.
5. **Buildable in phases that track the backend** — each rider phase consumes the matching API phase.

---

## 2. Lineage — What We Carry Forward

| Concern | Legacy RN (`KariRiderMobile`) | Legacy Flutter | **Decision** |
|---|---|---|---|
| Stack | Expo SDK 52 / RN 0.76 / TS ✓ | Flutter / Dart | **RN** (locked stack) |
| Navigation | Expo Router + RN tabs | per-tab nested navigators | **Expo Router** + per-tab stack reset |
| State | Zustand (one store) | Provider/ChangeNotifier | **Zustand, split by domain** |
| Server state | none (axios stubbed) | none | **TanStack Query** (new) |
| Maps | react-native-maps + Places ✓ | google_maps_flutter + Places | **RN's**, + debounce & polyline from Flutter |
| Styling | NativeWind/Tailwind | ThemeData | **NativeWind**, tokenized |
| Typography | SpaceMono (default leftover) | Poppins | **HankenGrotesk** (built; the Poppins pick was later changed) |
| Token storage | AsyncStorage (insecure) | none | **expo-secure-store** |
| Secrets | hardcoded key | **.env** | **env + backend proxy** |
| **Best screens** | auth set, driver-select, negotiation | **home grid, driver-assigned (chat/playlist/share), trip-summary, rating, wave app bar** | **union of both** |

**Net:** RN's architecture + Flutter's design polish + the screens each does best, all on real data.

---

## 3. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Expo SDK 54, RN 0.81, React 19, **New Arch on** | Latest SDK (Expo Go only runs current SDK); OTA, EAS builds |
| Language | TypeScript (strict) | Shared `@kari/types` with backend |
| Navigation | Expo Router v6 (file-based) | Typed routes, route groups, auth gating |
| Styling | NativeWind v4 + Tailwind | Tokenized design system |
| Fonts | **HankenGrotesk** (`@expo-google-fonts/hanken-grotesk`) + ArchivoExpanded (wordmark) | See context/design-tokens.md |
| Client state | Zustand | `auth` / `location` / `ride` / `signup` stores |
| Server state | **TanStack Query** | Caching, refetch, optimistic mutations |
| API client | thin typed `fetch` wrapper | Unwraps `ApiResponse<T>`, Bearer + refresh |
| Realtime | `socket.io-client` | Ride events from the gateway (JWT on connect) |
| Maps | `react-native-maps` (Google) | Markers, polyline, custom dark style |
| Location | `expo-location` | Permissions, current position, reverse-geocode |
| Places | Backend-proxied autocomplete | Keep the Google key server-side |
| Secure storage | `expo-secure-store` | Tokens (Keychain/Keystore) |
| Cache storage | `@react-native-async-storage/async-storage` | Non-sensitive UI cache |
| OTP UI | `react-native-otp-entry` | Carries from RN app |
| Bottom sheet | `@gorhom/bottom-sheet` | Draggable ride sheet (Flutter parity) |
| Animation | `react-native-reanimated` + `gesture-handler` | Wave header, sheet, transitions |
| Push | `expo-notifications` (Expo Push) | Ride + safety notifications (later phase) |
| Shared types | `@kari/types` (workspace) | One contract for both ends |
| Testing | Jest + React Native Testing Library; Maestro (e2e) | Unit + flow tests |
| Build/deploy | EAS Build / Update | iOS + Android |

---

## 4. Architectural Principles

1. **Server state ≠ client state.** TanStack Query owns anything from the API (profile, rides, quotes).
   Zustand owns ephemeral UI/session state (selected pickup, active ride id, auth tokens).
2. **One typed API client.** Every call goes through it; it attaches the access token, unwraps the
   `{ success, data, error }` envelope, and transparently refreshes on 401. Screens never see raw fetch.
3. **Contracts come from `@kari/types`.** Enums and DTO shapes are imported, never re-declared.
4. **Real-time drives ride UI.** The active-ride screen subscribes to socket events
   (`ride:accepted`, `ride:arrived`, `ride:started`, …) and reflects state immediately; HTTP is the fallback.
5. **Tokens live in the keychain.** `expo-secure-store`, never AsyncStorage.
6. **Secrets stay server-side.** Places autocomplete and directions go through the backend.
7. **Every screen has four states** — loading (skeleton), empty, error (retry), and content.
8. **Design tokens, not magic values.** Colors/spacing/radii/type come from the theme; no inline hex.
9. **Feature-foldered.** Code is grouped by feature (auth, onboarding, rides, account, safety), not by type.

---

## 5. App Structure

```
rider/
├── app/                          # Expo Router routes (thin screens)
│   ├── _layout.tsx               # Providers (Query, theme, fonts), splash, auth gate
│   ├── index.tsx                 # Redirect by auth state
│   ├── (auth)/                   # welcome, signup, verify-method, otp, signin, forgot-password
│   ├── (onboarding)/             # profile, liveness, preferences  (linear)
│   ├── (tabs)/                   # home, rides, account   (no (app) wrapper)
│   └── *.tsx                     # book, ride/[id], carpools, shuttle, wallet, … (flow screens — see screen-catalog.md)
├── src/                          # mostly thin re-exports of @kari/mobile-core
│   ├── api/                      # endpoints.ts (typed) + re-exports: client, session, queryClient, types
│   ├── stores/                   # auth, location, ride, signup (the substantial local logic)
│   ├── realtime/                 # useRideChannel + socket re-export
│   ├── components/               # 3 app-specific (AddressAutocomplete, BrandMark, DotTabBar) + primitive re-exports
│   ├── theme/                    # tokens re-export
│   └── lib/                      # env, storage, error, push
└── assets/                       # fonts, images, icons, lottie
```

---

## 6. Navigation Architecture

- **Expo Router**, route groups: `(auth)`, `(onboarding)`, `(app)/(tabs)`.
- **Auth gate (2-way)** in the root layout: `unauthenticated` & not in `(auth)` → `/(auth)/welcome`;
  `authenticated` & in `(auth)` → `/(tabs)/home`. **Onboarding is not root-gated** — `success.tsx` routes a
  new user into `/(onboarding)/profile`, then a linear profile → liveness → preferences chain.
- **Tabs**: Home · Rides · Account — custom dark + yellow **dot tab bar** (Flutter parity), each tab a
  stack; re-tapping a tab pops to its root.
- **Ride flow** is a nested stack pushed from Rides: `quote → searching → driver-assigned →
  in-progress → summary → rate` (the active-ride screens).
- Typed routes on (`typedRoutes: true`).

---

## 7. State Management

**Client (Zustand):**
- `useAuthStore` — `{ status, user, accessToken, refreshToken }`; `hydrate/setSession/setUser/logout`; also calls `configureApi(...)` to wire the shared mobile-core client.
- `useLocationStore` — `{ current, pickup, dropoff }` (each `{ lat, lng, address? }`).
- `useRideStore` — `{ activeRideId, lastQuoteRef }`.
- `useSignupDraft` — transient `{ email, phone, password, channel }` for multi-step signup. *(Detail: stores.md)*

**Server (TanStack Query):** profile (`/auth/me`, `/riders/me`), saved addresses, ride detail/history,
quotes (mutation), ride actions (mutations with optimistic status). Query keys namespaced per domain;
socket events invalidate/patch the relevant query cache so HTTP and realtime stay coherent.

---

## 8. Data Layer

- **`apiClient`** — wraps `fetch(baseUrl + path)`, sets `Authorization: Bearer`, parses the
  `ApiResponse<T>` envelope, returns `data` or throws a normalized `ApiError` (code + message + fields).
- **Refresh** — on 401, single-flight refresh against `/auth/refresh`, retries once; on failure → logout.
- **Endpoints module** — typed functions per backend route (`auth.signup`, `auth.verify`, `rides.quote`,
  `rides.request`, `rides.accept`…), parameters and returns typed from `@kari/types`.
- **Query/mutation hooks** — `useMe()`, `useRequestRide()`, `useRideQuote()`, etc., consumed by screens.
- **Trace id** — surface the response `traceId` in error toasts for support.

---

## 9. Realtime

- `socket.io-client` connects to the gateway with the access token in `auth.token`; reconnects with backoff.
- The app auto-joins its `user:{id}` room (server-side on connect). Rider subscribes to:
  `ride:accepted`, `ride:offer:driver`, `ride:arrived`, `ride:started`, `ride:completed`, `ride:cancelled`.
- A `useRideChannel(onEvent)` hook subscribes to those events (on the rider's `user:{id}` room) and maps
  them → cache/UI updates (driver assigned, en route, arrived, PIN, in-progress, completed).

---

## 10. Maps & Location

- `react-native-maps` (Google provider) with the shared **dark map style** (yellow roads), pickup/dropoff
  markers, and a route polyline (decoded from the backend quote/directions).
- `expo-location` for permission + current position; reverse-geocode for the pickup label.
- **Places autocomplete via the backend** (debounced 400–500ms) — no Google key in the client.
- Live driver position (when assigned) animates a marker from socket location updates (later phase).

---

## 11. Design System

The two legacy apps already converged on one identity — this formalizes it.

**Color tokens**
| Token | Value | Use |
|---|---|---|
| `brand` | `#FFFF00` | CTAs, active, highlights |
| `bg` | `#070707` | screen background |
| `surface` | `#121212` | nav bar, sheets |
| `card` | `#181818` | cards, inputs, sections |
| `border` | `#2A2A2A` | dividers, hairlines |
| `text` | `#FFFFFF` | primary text |
| `textMuted` | `#CBCBCB` | secondary text |
| `textSubtle` | `#888888` | meta/disabled |
| `success` `danger` | `#3BD17A` `#FF5A5F` | status |

**Typography** — **HankenGrotesk** (text) + **ArchivoExpanded** (the "Kari" wordmark). `display 28/700 · h1 24/700 · h2 20/600 · body 16/400 · bodySm 14/400 · caption 12/400 · micro 10/400`.

**Radii** — `pill 999 · input 30 · md 16 · card 12 · sm 8`.   **Spacing** — 4-pt scale (4/8/12/16/20/24/32).

**Core components** *(design sketch — the as-built set is in [ui-registry.md](ui-registry.md): 10 re-exported `@kari/mobile-core` primitives + 3 app-specific (`AddressAutocomplete`, `BrandMark`, `DotTabBar`). Items like WaveHeader/RideSheet/MapView/RideTypeGrid below were planned, not all built as separate components.)*
- `Screen` (safe-area + dark bg), `KariButton` (primary pill yellow/black 47px; `outline`; loading state),
  `InputField` (card bg, r30), `PhoneField` (country code), `OtpField` (4-digit, yellow focus).
- `WaveHeader` — signature yellow wave-clipped header ("Let's Ride, {name}", menu + bell).
- `DotTabBar` — dark rounded bar, yellow active dot.
- `MapView` + `RideSheet` (`@gorhom/bottom-sheet`), `PlacesField`, `LocationRow`.
- `RideTypeGrid` (Solo / Carpool / Subscription / Shuttle), `DriverCard`, `StarRating`,
  `AccountSection` + `AccountRow`, `Carousel`, `StatusPill`, `Skeleton` / `EmptyState` / `ErrorState`.

**Signatures to carry from Flutter:** wave app bar, draggable map sheet, dot nav, yellow-road map style,
auto-advancing home carousel.

---

## 12. Screen Inventory (union of both apps, on real data)

| Flow | Screens | Source |
|---|---|---|
| **Auth** | welcome (onboarding carousel) · signup · verify (SMS/WhatsApp) · otp · signin · success | RN |
| **Onboarding** | profile (name) · preferences (driver-behavior) · saved addresses (home/work) · NIN (optional, carpool) | new + Flutter |
| **Home** | wave header · location → Rides · promo carousel · **ride-type grid** · subscription routes · greeting | Flutter |
| **Rides (book)** | map + draggable sheet · pickup/dropoff Places · recent searches · "Find a ride" | both |
| **Quote & type** | tiered fares (Economy/Comfort/Premium) · solo/carpool select · **negotiate** (propose price) | both |
| **Active ride** | searching · **driver-assigned** (driver card, chat, playlist, share, notes) · en route · **start PIN** · in-progress | Flutter + new |
| **Post-ride** | **trip summary** (fare, route) · **rate driver** (5-star) | Flutter |
| **Account** | profile + rating · personal info · wallet · addresses · safety · preferences · logout | both |
| **Safety** | panic button · share trip · emergency contacts | new (req) |

---

## 13. Cross-Cutting Concerns

- **Env config** — typed env (API base URL, socket URL, Maps key for native SDK only) via `expo-constants` / `.env`.
- **Errors** — top-level error boundary; normalized API errors → toasts with `traceId`; retry affordances.
- **States** — every data screen renders skeleton / empty / error / content.
- **Auth lifecycle** — hydrate tokens on launch, refresh on 401, logout clears secure-store + query cache.
- **Offline** — Query cache persistence; "no connection" banner; queue-safe mutations where sensible.
- **Accessibility** — labels, hit slop, dynamic type, contrast (yellow-on-black passes AA for large text).
- **Analytics/observability** — screen + funnel events (signup→onboard→first-ride); crash reporting.
- **i18n** — English MVP; structure copy for future localization.

---

## 14. Requirements Traceability (rider-facing)

| Requirement (RSD v1.0) | Screen / module |
|---|---|
| Rider onboarding (name/phone/email; optional card, home/work) | Auth, Onboarding |
| Ride preference: driver behavior type | Onboarding/preferences |
| Pricing + negotiation (rider proposes, no floor) | Quote & type |
| OTP to confirm driver & start ride | Active ride (start PIN) |
| Emergency/panic button; share ride status | Safety |
| NIN verification for carpooling | Onboarding, Carpool |
| In-app chat & calls | Active ride (driver-assigned) |
| Wallet (fallback when bank apps fail) | Account/wallet |
| Cancellation penalties | Active ride / wallet |
| Ride variants: solo, carpool, shuttle, subscription | Home grid + flows |

---

## 15. Decisions Log

**Locked:**
1. Stack = Expo/RN/TS (matches platform decision).
2. Design tokens = the shared dark + `#FFFF00` system; typography = **HankenGrotesk** + ArchivoExpanded wordmark (the earlier Poppins pick was changed; SpaceMono dropped).
3. Tokens in **expo-secure-store**; secrets server-side.
4. Build on the RN app's structure; port Flutter's design + missing screens.

**Locked 2026-06-02 (cont.):**
5. **Server state** — ✅ TanStack Query (server data) + Zustand (UI/session state).
6. **Places** — ✅ backend-proxied autocomplete (add `GET /geo/autocomplete` to the backend in Phase 2; no Google key in the client).

**Open (decide before the phase that needs them):**
7. **Push** — Expo Push vs FCM (Phase 6; aligns with backend Phase 6).
8. **Chat** — build on our WebSocket vs a provider (aligns with backend Phase 6).

---

## 16. Build Plan (mirrors the backend phases)

Each phase ships a testable slice and consumes the matching backend phase.

| Phase | Rider scope | Consumes API |
|---|---|---|
| **0 · Foundation** | Expo scaffold in monorepo, theme/tokens, navigation + auth gate, Zustand stores, typed API client (`@kari/types`) + refresh, socket base, env, base components, splash + onboarding carousel | — |
| **1 · Identity & onboarding** | signup → OTP verify → signin/refresh/logout; rider onboarding (profile, preference, addresses, optional NIN) | Phase 1 |
| **2 · Core ride flow** | home (ride-type grid + map), quote → request → searching → live driver-assigned (socket) → arrived → start-PIN → in-progress → trip summary → rate; negotiation; account (read) | Phase 2 |
| **3 · Money** | wallet, top-up (Paystack), payment method, fare display, cancellation + penalties | Phase 3 |
| **4 · Engagement** | rewards/leaderboard view, subscriptions (manage routes), referrals | Phase 4 |
| **5 · Ride variants** | carpool (join/initiate, NIN gate), shuttle (routes/stops) | Phase 5 |
| **6 · Safety & comms** | panic, share-trip, emergency contacts, in-app chat, push notifications | Phase 6 |
| **7 · Hardening** | a11y, offline/empty/error polish, performance, e2e (Maestro), EAS store builds | Phase 7 |

*End of rider architecture draft v1. Build plan tracked with the backend phases; this doc updates as decisions land.*
