# Driver App Context

Detailed, code-verified reference for the **Kari driver app** (`driver/`). Complements the repo-wide
`context/` system and `context/design-tokens.md`. The driver app is built on the **rider app's foundation** —
read [rider/context](../../rider/context/README.md) for the shared patterns; this documents the **driver deltas**.

> **Authority: code is ground truth.** `ARCHITECTURE.md` was moved here and reconciled with the code.

## Files
[ARCHITECTURE.md](ARCHITECTURE.md) · [screen-catalog.md](screen-catalog.md) · [stores.md](stores.md) · [ui-registry.md](ui-registry.md)

## Stack
Same foundation as rider: Expo SDK 54 / RN 0.81 / React 19, expo-router v6, NativeWind, Zustand + TanStack
Query, `socket.io-client`, `@kari/mobile-core`. **Driver additions:** `expo-task-manager` + `expo-location`
(background location), dispatch sound/haptics, push (later phase).

## How the driver app differs from rider
- **Imports `@kari/mobile-core` directly** — no local re-export shims. There is **no `src/theme/` and no
  `src/api/client.ts`**; code imports `apiFetch`, `colors`, and primitives straight from `@kari/mobile-core`.
  (Rider wraps them in thin local re-exports; driver doesn't.)
- **Real 3-way hard gate** (KYC) — see below.
- **Default Expo `Tabs` + Ionicons** (home/trips/account), not a custom DotTabBar.
- **Dispatch + background location** are the defining additions (below).
- **5 stores** (adds `availability`, `carpool`; `ride` holds `incomingOffer`, not a quote ref).
- `src/components/` holds only 3 driver-specific components: `IncomingRequest`, `SwipeToAccept`, `BrandMark`.

## App shell & gate
- `app/_layout.tsx`: fonts (HankenGrotesk + ArchivoExpanded + GeistMono), providers (GestureHandler /
  SafeArea / QueryClient), and a root effect that bounces `unauthenticated` → `/(auth)/welcome`.
- `app/index.tsx` is the **3-way hard gate** (splash): `unauthenticated → welcome`; authenticated →
  `driversApi.me()` → `onboardingComplete ? /(tabs)/home : /(onboarding)`. **A driver cannot reach the app
  shell until KYC onboarding is complete** (unlike the rider, whose onboarding is soft).
- `(onboarding)/index.tsx` is the single-screen **6-step KYC wizard** (personal · quiz · vehicle ·
  details = payout + next-of-kin · NIN · liveness → complete), all via `driversApi`.

## Dispatch architecture (the core driver loop)
- **`useDriverDispatch()`** — the "dispatch brain," mounted once in `(tabs)/_layout.tsx`. Maps socket events
  → store + navigation: `ride:offer` → set `incomingOffer` (**only while online & idle**); `ride:accepted`
  (my counter won) → set active ride + `router.replace('/ride')`; `ride:cancelled` → clear the card;
  `carpool:offer` → push to the carpool store.
- **`useDispatchChannel(onEvent)`** subscribes to `['ride:offer','ride:accepted','ride:cancelled','carpool:offer']` on the driver's `user:{id}` room.
- **`<IncomingRequest offer={incomingOffer}>`** renders over any tab when an offer is pending (accept / reject / counter). Dispatch is an interrupt, not a screen.

## Background location (`src/location/tracker.ts`)
- A registered **`expo-task-manager` background task** (`kari-driver-location`) streams fixes to
  `availabilityApi.location` + the availability store while online (headless, no React state).
- `startTracking()` prefers a **true background** task (`startLocationUpdatesAsync`, Android foreground-service
  notification) — needs an **EAS dev/standalone build**; **falls back to a foreground watcher in Expo Go**.
  Balanced accuracy, 50 m / 10 s. `stopTracking()` on offline / ride-complete.

## API & socket wiring
- `auth.store.ts` calls `configureApi(...)` (from `@kari/mobile-core`) — same as rider, but with
  **driver-namespaced** secure-store keys (`kari.driver.accessToken` / `…refreshToken`).
- **API surface:** `src/api/endpoints.ts` — 14 groups. Driver-specific: `driversApi` (the 9-call KYC wizard),
  `availabilityApi` (online/location/offline), `paymentsApi.earnings`, `walletApi.payout`, and the driver-side
  `ridesApi` (accept / offer / arrived / start / complete / cancel / rate) + `carpoolsApi` (accept / complete).
