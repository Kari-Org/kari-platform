# Zustand Stores

Five client-state stores in `src/stores/`. Server data → TanStack Query.

## `useAuthStore` (auth.store.ts)
Same shape/behavior as the rider's: `{ status, user, accessToken, refreshToken }` +
`hydrate/setSession/setUser/logout`; wires the shared client via `configureApi(...)` from `@kari/mobile-core`.
**Driver-namespaced** secure-store keys: `kari.driver.accessToken` / `kari.driver.refreshToken`.

## `useAvailabilityStore` (availability.store.ts)
**State:** `{ online, lastFix: {lat,lng} | null, watching }`. **Actions:** `setOnline`, `setFix`, `setWatching`.
- Drives the online toggle and the location tracker — `tracker.ts` writes `lastFix` + `watching`.

## `useRideStore` (ride.store.ts)
**State:** `{ activeRideId, incomingOffer: Ride | null }`. **Actions:** `setActiveRide`, `setIncomingOffer`.
- `incomingOffer` holds the dispatched `Ride` for the `IncomingRequest` overlay; `activeRideId` is the in-progress trip.
- (Note: differs from the rider's ride store, which holds `lastQuoteRef` instead.)

## `useCarpoolStore` (carpool.store.ts)
**State:** `{ offers: Carpool[], activeCarpoolId }`. **Actions:** `addOffer` (dedup by id), `removeOffer`, `setActive`, `clearOffers`.
- Drivers discover carpools **only via the `carpool:offer` socket event** — there is no joinable-carpools read
  endpoint for drivers. Offers accumulate here while online; the Carpool screen renders + acts on them.

## `useSignupDraft` (signup.store.ts)
Transient signup draft `{ email, phone, password, channel }` — same pattern as rider; the channel is chosen
before `/auth/signup` is called. Cleared after completion.

---
**Pattern:** one store per concern; actions inside the store; never fetch server data in a store.
