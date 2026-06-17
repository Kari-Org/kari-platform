# Zustand Stores

Four client-state stores in `src/stores/`. **Server data lives in TanStack Query, not here** — these hold
only ephemeral UI/session state.

## `useAuthStore` (auth.store.ts)
**State:** `{ status: 'loading' | 'unauthenticated' | 'authenticated', user, accessToken, refreshToken }`
**Actions:** `hydrate()` (load tokens from secure-store on launch), `setSession(tokens, user?)`, `setUser(user)`, `logout()`.
- Tokens persist in **`expo-secure-store`** (`kari.accessToken` / `kari.refreshToken`).
- **Also wires the shared client:** on module load it calls `configureApi({ baseUrl, socketUrl,
  getAccessToken, getRefreshToken, setTokens, onUnauthorized })` so mobile-core's `apiFetch` + socket use
  this app's env + auth — with single-flight refresh and `onUnauthorized → logout()`.
- `status` drives the root auth gate in `_layout.tsx`.

## `useLocationStore` (location.store.ts)
**State:** `{ current, pickup, dropoff }` — each a `GeoPlace { lat, lng, address? }`.
**Actions:** `setCurrent`, `setPickup`, `setDropoff`, `reset()` (clears pickup + dropoff).
- Drives the booking flow (rides tab → book → ride). `reset()` after a ride ends.

## `useRideStore` (ride.store.ts)
**State:** `{ activeRideId, lastQuoteRef }`. **Actions:** `setActiveRide`, `setQuoteRef`.
- A minimal in-flight pointer; the ride *data* comes from TanStack Query (`ridesApi.get`) patched by socket events.

## `useSignupDraft` (signup.store.ts)
**State:** `{ email, phone, password, channel }`. **Actions:** `set(patch)`, `clear()`.
- **Transient** draft for multi-step signup: credentials are collected on `signup`, then the user picks the
  OTP `channel` on `verify-method` **before** `/auth/signup` is called. `clear()` after completion.

---

**Pattern:** one store per concern; actions live inside the store (no dispatch); never fetch server data in
a store. See context/code-standards.md → Mobile → State Management.
