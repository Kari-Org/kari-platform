# Entity Relationships

The 29-entity graph, extracted from `*.entity.ts`. **Tables are snake_case plural; columns are camelCase.**

## How relations are modeled (important)
- Almost all relations are **FK-by-convention**: a plain `@Column('uuid')` named `xxxId` — **not** a TypeORM
  `@ManyToOne`. So you join manually by id; there are no eager relation graphs except the two below.
- **Only two real TypeORM relations exist:**
  - `DriverProfile` `@OneToOne` ↔ `Vehicle`
  - `RiderProfile` `@OneToMany` ↔ `SavedAddress` (`cascade`, `eager`, `onDelete: CASCADE`)
- **`BaseEntity`** (extended by all 29): `id` (uuid PK), `createdAt`, `updatedAt` (both `timestamptz`).
- **Optimistic lock (`@VersionColumn`):** `Ride`, `Carpool`, `Wallet`, `ShuttleTrip`.

## The hub: `User`
`users.id` is the universal foreign key. **`riderId` / `driverId` / `creatorId` / `assignedDriverId` /
`senderId` / `actorId` … all reference `users.id`** (a User row whose `role` is RIDER/DRIVER/ADMIN) — **not**
the profile tables. Profiles hang off the user:
```
users.id ──< driver_profiles.userId   (1:1 via convention)
users.id ──< rider_profiles.userId    (1:1 via convention)
```
So: ride → driver = `rides.driverId → users.id → driver_profiles.userId`. `User.referredByUserId` is a
nullable self-reference (referrals).

---

## By group (entity → its FK columns → target)

### Users & Profiles
| Entity (table) | FK columns → target | Notes |
|---|---|---|
| `User` (users) | `referredByUserId?` → users | role, email, phone, passwordHash, status, adminRole, referralCode |
| `DriverProfile` (driver_profiles) | `userId` → users; **`@OneToOne` vehicle** | driverType, personality, onboardingComplete, kyc/nin status, spotifyInstalled, rating |
| `RiderProfile` (rider_profiles) | `userId` → users; **`@OneToMany` addresses** | preferences (gender/music/accessibility), cardToken, nin status, rating |
| `Vehicle` (vehicles) | `@OneToOne` driverProfile | model, plate, photos |
| `SavedAddress` (saved_addresses) | `@ManyToOne` riderProfile | label (home/work), geo; cascade-deleted with profile |

### Rides
| Entity | FK columns → target | Notes |
|---|---|---|
| `Ride` (rides) | `riderId` → users; `driverId?` → users | type, status (state machine), pickup/dropoff geo, quoted/agreedPrice, paymentMethod, startOtp, **`@Version`** |
| `RideOffer` (ride_offers) | `rideId` → rides; `driverId` → users | negotiation counter-offers, status |
| `Rating` (ratings) | `rideId` → rides; `raterId` → users; `rateeId` → users | mutual driver↔rider |

### Money
| Entity | FK columns → target | Notes |
|---|---|---|
| `Wallet` (wallets) | `ownerId?` → users (null = system: REVENUE / GATEWAY) | balance (kobo, projection), walletOwnerType, **`@Version`** |
| `LedgerEntry` (ledger_entries) | `transactionId` → transactions; `walletId` → wallets | direction CREDIT/DEBIT, amount (kobo) |
| `Transaction` (transactions) | `userId?` → users; `rideId?` → rides | type, status, reference (idempotency), gatewayRef |

### Engagement
| Entity | FK columns → target | Notes |
|---|---|---|
| `DriverScore` (driver_scores) | `driverId` → users | points; ISO-week + `ALL` all-time buckets |
| `Achievement` (achievements) | `driverId` → users | badge enum |
| `Subscription` (subscriptions) | `riderId` → users; `assignedDriverId?` → users | planId (static), route, status; assignedDriverId = sticky |

### Ride variants
| Entity | FK columns → target | Notes |
|---|---|---|
| `Carpool` (carpools) | `creatorId` → users; `driverId?` → users | totalFare, cost-split, **`@Version`** seat guard |
| `CarpoolMember` (carpool_members) | `carpoolId` → carpools; `riderId` → users | per-member share |
| `ShuttleRoute` (shuttle_routes) | — | Lekki/Aba corridors |
| `ShuttleStop` (shuttle_stops) | `routeId` → shuttle_routes | ordered, cumulative `fareFromOrigin` |
| `ShuttleTrip` (shuttle_trips) | `routeId` → shuttle_routes; `driverId?` → users | seat inventory, **`@Version`** |
| `ShuttleBooking` (shuttle_bookings) | `tripId` → shuttle_trips; `riderId` → users; `fromStopId`/`toStopId` → shuttle_stops | stop-distance fare |

### Safety & Comms
| Entity | FK columns → target | Notes |
|---|---|---|
| `EmergencyContact` (emergency_contacts) | `userId` → users | name, phone |
| `PanicEvent` (panic_events) | `userId` → users; `rideId?` → rides | status |
| `SharedTrip` (shared_trips) | `rideId` → rides | opaque token, 12h TTL, revocable |
| `ChatMessage` (chat_messages) | `rideId` → rides; `senderId` → users; `recipientId` → users | in-ride chat |
| `Notification` (notifications) | `userId` → users | title, body, channels, read |
| `DeviceToken` (device_tokens) | `userId` → users | push token per platform |

### Admin & Identity
| Entity | FK columns → target | Notes |
|---|---|---|
| `Document` (documents) | `userId` → users | type, S3 url, status |
| `AuditLog` (audit_logs) | `actorId?` → users; `targetId?` (polymorphic) | method, path, before/after JSON, reason |
| `SupportTicket` (support_tickets) | `requesterId` → users; `rideId?` → rides; `handledById?` → users | source APP/WEB/EMAIL, status |
