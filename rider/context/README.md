# Rider App Context

Detailed, code-verified reference for the **Kari rider app** (`rider/`). Complements the repo-wide
`context/` system (read that first) and the design spec in `context/design-tokens.md`.

> **Authority: code is ground truth.** Extracted from `app/` and `src/`. `ARCHITECTURE.md` (design intent)
> was moved into this folder and reconciled with the code.

## Files
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — design rationale + legacy lineage (RN + Flutter → unified), reconciled with code.
- **[screen-catalog.md](screen-catalog.md)** — every route/screen, its purpose, and the stores/APIs it uses.
- **[stores.md](stores.md)** — the 4 Zustand stores (state + actions).
- **[ui-registry.md](ui-registry.md)** — components (re-exported primitives + app-specific) + design-token usage.

---

## Stack & shape
- **Expo SDK 54, RN 0.81, React 19, expo-router v6.** NativeWind 4 styling. **Zustand** (client state) +
  **TanStack Query** (server state). `socket.io-client` for live ride events.
- Built on **`@kari/mobile-core`** — the shared API client, socket, theme tokens, and 10 UI primitives.

## The `@kari/mobile-core` re-export pattern (important)
The rider app's `src/components`, `src/theme`, `src/api`, `src/realtime` are **thin re-exports** of
`@kari/mobile-core` — e.g. `src/components/KariButton.tsx` is literally `export { KariButton } from '@kari/mobile-core'`,
and `src/api/client.ts` re-exports `apiFetch`/`ApiError`. Shared logic lives in mobile-core; **this app owns
only its screens, its 4 stores, and 3 app-specific components** (`AddressAutocomplete`, `BrandMark`,
`DotTabBar`). Don't reimplement a primitive locally — re-export it.

## App shell & gate (`app/_layout.tsx`)
- **Fonts:** HankenGrotesk (400/500/600/700), GeistMono, ArchivoExpanded (wordmark) — matches design-tokens.md.
- **Providers:** `GestureHandlerRootView` → `SafeAreaProvider` → `QueryClientProvider`; `StatusBar` light; dark `bg` content.
- **Auth gate (2-way):** a root effect syncs the route group with `useAuthStore.status` — `unauthenticated` & not in `(auth)` → `/(auth)/welcome`; `authenticated` & in `(auth)` → `/(tabs)/home`.
- **Splash:** `app/index.tsx` is an animated splash (RN `Animated`, no Reanimated) that self-routes after ~4.2s to home/welcome by auth status.
- **Onboarding is NOT root-gated** (unlike the driver app): it's reached by explicit navigation — `success.tsx` sends a new user to `/(onboarding)/profile`, then a linear push chain **profile → liveness → preferences**.

## API & socket wiring
- **`auth.store.ts` calls `configureApi(...)`** on load — pointing mobile-core's `apiFetch` + socket at this
  app's `env` URLs and tokens, with single-flight refresh and `onUnauthorized → logout`. Tokens persist in `expo-secure-store`.
- **API surface:** `src/api/endpoints.ts` exposes **14 typed groups**: `authApi · ridersApi · placesApi ·
  ridesApi · walletApi · referralsApi · subscriptionsApi · gamificationApi · carpoolsApi · shuttleApi ·
  safetyApi · commsApi · notificationsApi · ticketsApi`. Shapes typed from `@kari/types` + `src/api/types.ts`.
- **Live ride events:** `useRideChannel(onEvent)` subscribes to `ride:accepted/arrived/started/completed/cancelled/offer:driver` on the rider's `user:{id}` socket room.
