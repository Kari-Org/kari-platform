# Module Catalog

Every backend module, extracted from `*.module.ts` / `*.controller.ts`. ~25 modules: 18 domain + 7 infra.
"Depends on" = the other feature modules it imports (to use their exported services).

---

## Domain modules

| Module | Base route(s) | Owns entities | Exports | Depends on | Responsibility |
|---|---|---|---|---|---|
| **auth** | `/auth` | — (uses `User`) | `JwtModule`, `PassportModule`, `PasswordService` | users | Signup, login, OTP (SMS/WhatsApp), Google, refresh rotation, forgot/reset, `/auth/me`. Issues JWTs; `@Public` routes. |
| **users** | — (no controller) | `User` | `UsersService` | — | The `User` identity entity + shared user ops; referral codes. |
| **rider** | `/riders` (RIDER) | `RiderProfile`, `SavedAddress` | `RiderService` | identity | Rider profile, onboarding, preferences survey, saved addresses, NIN, liveness. |
| **driver** | `/drivers` (DRIVER) | `DriverProfile`, `Vehicle` | `DriverService` | identity | Driver profile, 6-step KYC wizard, personality quiz, vehicle, availability flags. |
| **identity** | `/identity` | `Document` | `IdentityService` | — | Document upload (S3 provider), NIN verification, liveness sessions. |
| **rides** | `/rides`, `/availability` | `Ride`, `RideOffer`, `Rating` | `PricingService`, `MatchingService` | driver, gamification, money, realtime, referrals, rider, subscriptions | **Core hub.** Ride lifecycle/state machine, quote+pricing, Redis-GEO matching, negotiation/offers, mutual ratings, online/offline/location. |
| **money** | `/wallet`, `/payments` | `Wallet`, `Transaction`, `LedgerEntry` | `PaymentsService`, `LedgerService`, `CommissionService` | driver, gamification, rides, users | Double-entry ledger, wallet, top-up/payout (Paystack), commission, earnings, ride settlement, webhook. |
| **gamification** | `/leaderboard`, `/gamification` | `DriverScore`, `Achievement` | `GamificationService` | driver, money | Points per ride, badges, weekly leaderboard, commission-reduction calc. |
| **referrals** | `/referrals` | — (uses `User`) | `ReferralsService` | money | Referral codes, apply, first-completed-ride reward. |
| **subscriptions** | `/subscriptions` | `Subscription` | `SubscriptionsService` | money | Static plan catalog, subscribe (wallet charge), sticky-driver capture. |
| **carpools** | `/carpools` | `Carpool`, `CarpoolMember` | — | money, realtime, rider, rides | Create/join/leave, NIN gate, equal-split fare, dispatch, settle (`@Version` seat guard). |
| **shuttle** | `/shuttle` | `ShuttleRoute`, `ShuttleStop`, `ShuttleTrip`, `ShuttleBooking` | — | money | Routes/stops/trips (seeded on boot), bookings, `@Version` seat inventory. |
| **safety** | `/safety`, `/rides/:id/share`, `/trips/shared/:token` | `EmergencyContact`, `PanicEvent`, `SharedTrip` | — | driver, notifications, realtime | Emergency contacts, panic (SOS via queue + `'ops'` socket), share-trip token (12h TTL, PIN/PII hidden). |
| **comms** | `/rides/:id/messages`, `/rides/:id/call` | `ChatMessage` | — | realtime | In-ride chat (persisted + socket), masked calls (Voice provider). Participant-gated. |
| **notifications** | `/notifications` | `Notification`, `DeviceToken` | `NotificationsService` | — | The one real **BullMQ `notifications` queue** + worker; in-app/push/SMS/email fan-out; device tokens. |
| **places** | `/places` | — | — | — | Autocomplete + reverse geocode (proxied `MapsProvider`; OSM Nominatim noop). |
| **tickets** | `/tickets` | `SupportTicket` | `TicketsService` | — | Support ticket submit + list (source APP/WEB/EMAIL). |
| **admin** | `/admin` (ADMIN + `@RequirePermissions`) | `AuditLog` (+ reads `User`, `Ride`, profiles, `Transaction`) | — | auth, driver, money, realtime, rides, tickets, users | Ops console API: stats, users, rides, fleet, verify, override, dedicated onboard, finance, fare-config, tickets, audit. |

---

## Infrastructure modules

| Module | Provides / exports | Role |
|---|---|---|
| **config** | `APP_CONFIG` | Zod-validated env config, loaded + validated at boot. |
| **database** | TypeORM `DataSource` | Connection, entity registration, seed scripts (`seed-admin`, shuttle seeds). |
| **redis** | `REDIS_CLIENT` | Shared Redis client (driver geo, quotes, rate-limit counters). |
| **queue** | `BullModule` (root) | BullMQ root (`forRootAsync`); feature modules register their own queues. |
| **realtime** | `RealtimeService` (gateway internal); depends on **auth** | Socket.IO gateway (JWT on connect → `user:{id}` room) + `RealtimeService` facade (`emitToUser`/`emitToRoom`). |
| **providers** | 10 provider DI tokens (`@Global`) | All external-service contracts + impls (only Paystack real; rest noop). |
| **common / logger** | Guards, filters, interceptors, decorators, `BaseEntity`; pino logger | Cross-cutting; `BaseEntity` (uuid + timestamps) extended by all 29 entities. |

---

## Dependency notes
- **`rides` is the orchestration hub** — it imports 7 modules (driver, gamification, money, realtime, referrals, rider, subscriptions) because completing a ride touches matching, settlement, rewards, sticky-driver, and sockets.
- **`money` is the most-depended-on domain** — imported by carpools, gamification, referrals, rides, shuttle, subscriptions, admin (anything that moves value).
- **`realtime`** is imported by rides, carpools, comms, safety, admin (anything that pushes live events).
- **`identity`** underpins both `rider` and `driver` (NIN + liveness + docs).
- No circular module imports — the graph is acyclic (NestJS would fail to boot otherwise; cross-cutting needs go through exported services).
- **Cross-module entity reads:** `admin` registers `User`/`Ride`/`RiderProfile`/`DriverProfile`/`Transaction` read-only; `comms` registers `Ride`/`User`; `safety` registers `Ride`; `notifications`/`referrals` register `User`. The entity's **owning** module is the one in whose folder it lives.
