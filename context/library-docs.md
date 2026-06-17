# Library Docs

Project-specific usage patterns for key libraries in KariPlatform. Read the relevant section before implementing any feature that touches these libraries.

---

## Authority Order

```
Actual code (contracts.ts, *.service.ts) → this file + the context/ system → per-app ARCHITECTURE.md (design intent) → general training knowledge
```

The per-app `ARCHITECTURE.md` files are **design intent and can lag the code** (they describe Argon2id, Auth.js, and ride-scoped socket rooms — none of which match the implementation). When they disagree with the source, **the code wins**. This file documents cross-cutting library usage, verified against the code.

---

## TypeORM (Backend)

### Entity Definition
```typescript
@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.SEARCHING })
  status: RideStatus;

  @Column({ type: 'bigint', nullable: true })
  quotedPrice: number;  // kobo

  @VersionColumn()
  version: number;  // optimistic locking

  @ManyToOne(() => User)
  @JoinColumn({ name: 'riderId' })
  rider: User;

  @Column('uuid')
  riderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### QueryRunner Transactions
```typescript
const qr = this.dataSource.createQueryRunner();
await qr.connect();
await qr.startTransaction();
try {
  await qr.manager.save(Wallet, debitedWallet);
  await qr.manager.save(LedgerEntry, debitEntry);
  await qr.manager.save(LedgerEntry, creditEntry);
  await qr.commitTransaction();
} catch (err) {
  await qr.rollbackTransaction();
  throw err;
} finally {
  await qr.release();
}
```

**Rules:**
- Every multi-write uses QueryRunner — never save multiple entities without a transaction
- `@VersionColumn()` on Ride, Carpool, ShuttleTrip — handle OptimisticLockVersionMismatchError
- camelCase column names (TypeScript convention)
- Money: `bigint` type, kobo units, never decimal
- `DB_SYNCHRONIZE=true` in dev only

---

## Socket.IO (Backend + Mobile)

### Backend — emit via `RealtimeService` (not the gateway directly)
```typescript
// realtime/realtime.service.ts — a thin facade over the Socket.IO server.
emitToUser(userId: string, event: string, payload: unknown): void  // -> room `user:${userId}`
emitToRoom(room: string, event: string, payload: unknown): void    // generic (e.g. the 'ops' room)
```
Feature services inject `RealtimeService` and call `emitToUser(...)`. **There is no `emitToRide` or
`emitToDriver`.** The gateway (`realtime.gateway.ts`) only authenticates the JWT on connect and joins the
socket to its `user:{id}` room.

### Mobile Socket (from @kari/mobile-core)
```typescript
import { connectSocket, getSocket, disconnectSocket } from '@kari/mobile-core';

connectSocket();                                    // connects the singleton; token attached automatically
getSocket().on('ride:accepted', (data) => { ... });
getSocket().on('ride:offer', (data) => { ... });
// on logout: disconnectSocket();
```
The token is read from `session.accessToken` via the socket's `auth` callback on every (re)connect — no manual `socket.auth =` assignment.

**Events the backend emits:**
- **Ride → rider:** `ride:accepted`, `ride:offer:driver` (driver's counter), `ride:arrived`, `ride:started`, `ride:completed`, `ride:cancelled`
- **Ride → driver:** `ride:offer` (dispatch), `ride:accepted`, `ride:cancelled`
- **Carpool:** `carpool:offer`, `carpool:joined`, `carpool:matched`
- **Chat:** `chat:message` · **Safety:** `safety:panic` (to the `'ops'` room)

**Rules:**
- Emit to **`user:{userId}` rooms** via `emitToUser` — never broadcast. (No `ride:`/`driver:` rooms exist.)
- Redis adapter (`@socket.io/redis-adapter`) is wired in `main.ts` for horizontal scaling.
- JWT validated on connect (handshake `auth.token`, `Authorization` header, or `?token=`).
- Ride event payloads are enriched with the counterparty summary (via `RidesService.view`).

---

## BullMQ (Backend)

### Job Pattern (`@nestjs/bullmq` — `WorkerHost`, not `@Process`)
```typescript
// producer
@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notifications') private queue: Queue) {}
  async notify(/* … */) {
    await this.queue.add('deliver', { notificationId });  // or 'sms' for a raw SMS to a number
  }
}

// consumer — extend WorkerHost and switch on job.name
@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    if (job.name === 'sms')     { /* raw SMS to an arbitrary number (e.g. emergency contacts) */ return; }
    if (job.name === 'deliver') { /* fan a persisted Notification out to push/SMS/email per its channels */ }
  }
}
```

**Queues (actually registered): only `notifications`** (jobs: `deliver`, `sms`). The BullMQ root
(`queue/queue.module.ts`) is set up for more — its comment mentions OTP-expiry/commission/leaderboard/billing
— but **those queues are not registered yet**; `notifications` is the only live queue.

**Rules:**
- Never use `setTimeout` — use BullMQ for async/deferred work.
- Redis is the broker — jobs survive backend restarts.
- Delivery is best-effort: persist the durable record (the in-app `Notification` row) synchronously, then queue the side-effects.

---

## Paystack (Backend, behind PaymentProvider)

```typescript
// Never import the Paystack SDK in modules — depend on the PaymentProvider interface (full contract in provider-docs.md)
interface PaymentProvider {
  initiateCharge(input: ChargeInput): Promise<ChargeResult>;        // top-up
  verifyCharge(reference: string): Promise<ChargeStatus>;
  initiateTransfer(input: TransferInput): Promise<TransferResult>;  // payout
  verifyTransfer(reference: string): Promise<ChargeStatus>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
```

**Rules:**
- All amounts in kobo (minor units)
- Idempotency keys on all payment requests
- Verify webhook signatures before processing
- NoopPaymentProvider auto-succeeds in dev (no Paystack key needed)

---

## Google Maps (Backend + Mobile)

### Backend (MapsProvider — full contract in provider-docs.md)
```typescript
// Pricing: distance + duration
const est = await mapsProvider.estimateTrip({ origin: pickup, destination: dropoff });
// est: { distanceMeters, durationSeconds, durationInTrafficSeconds?, provider }

// Places autocomplete (proxied through backend; optionally biased near a point)
const suggestions = await mapsProvider.autocomplete(query, nearPoint);
```

### Mobile (expo-location + Maps)
```typescript
import * as Location from 'expo-location';

// Foreground location
const location = await Location.getCurrentPositionAsync({});

// Background (driver only, via expo-task-manager)
await Location.startLocationUpdatesAsync('DRIVER_LOCATION_TASK', {
  accuracy: Location.Accuracy.High,
  distanceInterval: 50,
  foregroundService: { notificationTitle: 'Kari Driver', notificationBody: 'Tracking location' },
});
```

**Rules:**
- Backend proxies all Places/Geocoding calls — mobile never calls Google Maps API directly (except for map rendering)
- NoopMapsProvider uses OpenStreetMap Nominatim (Nigeria-only) in dev
- Driver background location needs EAS dev build (not Expo Go)

---

## Expo Router v6 (Mobile)

### File-based Routing
```
app/
├── _layout.tsx           # Root layout (3-way gate)
├── index.tsx             # Splash redirect
├── (auth)/
│   ├── _layout.tsx       # Auth stack
│   ├── welcome.tsx       # Welcome screen
│   ├── signup.tsx         # Phone input
│   ├── verify.tsx         # OTP entry
│   └── login.tsx          # Login
├── (onboarding)/
│   ├── _layout.tsx       # Onboarding stack
│   └── index.tsx          # Multi-step flow
├── (tabs)/
│   ├── _layout.tsx       # Tab navigator
│   ├── home.tsx           # Dashboard / map
│   ├── rides.tsx          # Booking entry (rider) / Trip history (driver)
│   └── account.tsx        # Profile / settings
├── book.tsx               # Ride booking flow (rider)
├── ride/[id].tsx          # Active ride tracking
└── ride-history.tsx       # Completed rides
```

**Rules:**
- Never `router.replace()` during render — always in `useEffect` or event handlers
- Flow screens (book, ride) are pushed onto the stack, not tabs
- Every pushed screen has a `<ScreenHeader>` back chevron
- Route params typed via Expo Router's typed routes

---

## NativeWind 4 (Mobile)

### Setup
```javascript
// tailwind.config.js (each app)
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../packages/mobile-core/src/**/*.{ts,tsx}',  // shared components
  ],
  presets: [
    require('nativewind/preset'),
    require('@kari/mobile-core/tailwind-preset'),  // shared tokens
  ],
};
```

**Rules:**
- All styling via `className` prop — never `StyleSheet.create` for colors/spacing
- Theme tokens defined in `@kari/mobile-core/theme/tokens` — never hardcode hex
- Dark theme: background black, text white, brand yellow `#FFFF00`
- Pinned to `nativewind@4.2.4` (works with Expo SDK 54 + Reanimated 4)
- Animated splash uses RN's built-in `Animated` API (not Reanimated) to avoid worklet crashes

---

## Zustand (Mobile)

### Store Pattern
```typescript
export const useRideStore = create<RideState>((set, get) => ({
  currentRide: null,
  setRide: (ride) => set({ currentRide: ride }),
  clearRide: () => set({ currentRide: null }),
}));
```

**Rules:**
- One store per domain concern (auth, ride, availability, signup)
- Actions defined inside the store — never dispatch patterns
- Persist tokens to `expo-secure-store`, not AsyncStorage
- Clear ride state on completion/cancellation
- Rider: transient `signup.store` for the multi-step signup flow (cleared after completion)

---

## pino (Backend Logging)

```typescript
// Structured logging with traceId
this.logger.log({ traceId, rideId, action: 'ride:accepted' }, 'Driver accepted ride');
this.logger.error({ traceId, error: err.message }, 'Payment failed');
```

**Rules:**
- Always include `traceId` for request correlation
- Never log sensitive data (tokens, passwords, full card numbers)
- Log level from `LOG_LEVEL` env var
- In dev, noop providers log OTPs: `Your Kari code is NNNN`
