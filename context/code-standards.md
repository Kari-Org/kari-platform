# Code Standards

Implementation rules and conventions for the entire KariPlatform monorepo. Follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

- Think before implementing — understand what is being built and why before writing a single line
- Read the relevant ARCHITECTURE.md before touching any app (backend/, rider/, driver/, admin/ each have one)
- Read this context system before any session — especially progress-tracker.md for current state
- Scope is sacred — only build what the current feature requires
- Every feature must be testable — if it cannot be verified, it is incomplete
- Clean over clever — simple readable code that any developer can understand
- One thing at a time — complete one feature fully before touching the next

---

## Design Principles (SOLID)

Write to SOLID. The codebase already leans on these — keep applying them in new code.

- **S — Single Responsibility.** One reason to change per unit. Controllers stay thin (HTTP only);
  orchestration services own flow; data services own DB + transactions; one module per domain. Don't let a
  service grow a second job.
- **O — Open/Closed.** Extend without editing callers. A new payment vendor = a new `PaymentProvider`
  impl, not an edit to `MoneyModule`. A new ride type = a new branch behind the matching contract, not a
  rewrite of the ride service.
- **L — Liskov Substitution.** Every impl honors its interface identically. `NoopPaymentProvider` and
  `PaystackPaymentProvider` are interchangeable — the keyless dev flow proves it. A noop that only "mostly"
  behaved would break this.
- **I — Interface Segregation.** Narrow, per-capability interfaces. SMS, WhatsApp, Voice, Push, and Email
  are **separate** provider contracts — not one `MessagingProvider` god-interface. Depend only on what you use.
- **D — Dependency Inversion.** Depend on abstractions. NestJS DI injects interfaces; **modules never
  import a vendor SDK directly** — they take the provider contract. Mobile screens depend on `apiFetch`, not raw `fetch`.

---

## Design Patterns

Use the Gang-of-Four catalog as shared vocabulary. **Reach for a pattern when the problem matches the
table below — never to decorate code.** Forcing a pattern where the problem doesn't call for it violates
*Scope is sacred* and *Clean over clever*; speculative abstraction is a smell, not a standard.

**Already in the codebase (extend these, don't reinvent):**
- **Strategy / Adapter** — provider contracts (`PaymentProvider`, `SmsProvider`, …) with swappable real/noop impls; `RedisIoAdapter` adapts Socket.IO onto Redis.
- **Facade** — `RealtimeService` is a thin facade over the Socket.IO server (feature services never touch the gateway).
- **Repository** — TypeORM repositories behind the two-tier data services.
- **State** — the ride state machine (`SEARCHING → … → COMPLETED`) with guarded transitions (`OPEN_STATUSES`).
- **Observer / pub-sub** — Socket.IO rooms + BullMQ queues decouple emitters from handlers.
- **Dependency Injection** — NestJS providers throughout (the backbone of SOLID's *D*).
- **Singleton** — the lazily-created mobile socket in `@kari/mobile-core` (`realtime/socket.ts`).

**When to reach for which (GoF quick reference):**

| Pattern | Use when you want to… |
|---|---|
| Abstract factory | create objects of different families and hide from the client which family is created |
| Adapter | convert one interface to another |
| Bridge | maintain a stable client interface while the implementation changes |
| Builder | flexibility to use different processes and ways to perform the steps of a process |
| Chain of responsibility | process requests with handlers, but the exact handler is unknown in advance |
| Command | execute operations flexibly — queuing, scheduling, undoing, redoing |
| Composite | a uniform interface over objects in recursive, part-whole relationships |
| Decorator | add (or remove) functionality on objects dynamically |
| Facade | simplify the client interface to a web of components |
| Factory method | dynamically change the products created |
| Flyweight | an economical way to create numerous occurrences of an object |
| Interpreter | process rules that change frequently and quickly on the fly |
| Iterator | a traversal mechanism that hides the underlying data structure |
| Mediator | decouple objects that interact in a complex manner |
| Memento | store/restore an object's state, accessible only to that object |
| Observer | decouple event handlers from an event source; add/remove handlers dynamically |
| Prototype | reduce classes by reusing copies of an object (creation cost, or dynamic loading) |
| Proxy | remote, delayed, or controlled access — or tracking accesses to an object |
| Singleton | at most one (or a limited number of) globally accessible instances |
| State | a low-complexity design to implement a state diagram |
| Strategy | selectively apply algorithms with the same function but different non-functional traits (memory, perf) |
| Template method | vary the implementations of steps of a process or algorithm |
| Visitor | decouple type-dependent operations from their classes (high cohesion, "stupid objects") |

---

## TypeScript (All Projects)

- Strict mode everywhere — no exceptions
- Never use `any` — use `unknown` and narrow
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types explicitly typed
- Use `type` for object shapes and unions — `interface` only for extendable props
- All async functions must have proper error handling
- Use `const` by default — `let` only when reassignment is necessary

---

## Backend (NestJS)

### Module Structure
Every backend module is a NestJS module folder. Services are split **by concern**, not by tier:
```
src/{module}/
├── {module}.module.ts          # Module definition (providers, imports, exports)
├── {module}.controller.ts      # HTTP routes only — no business logic
├── {module}.service.ts         # Primary service; large domains add concern-split services, e.g.
│                               #   money/  → wallet, ledger, payments, commission services
│                               #   rides/  → rides, matching, pricing services
├── dto/                        # Request/response DTOs (class-validator)
├── entities/                   # TypeORM entities
└── guards/                     # Module-specific guards (if any)
```

### Service Rules
- **Split services by concern, one responsibility each** (`wallet.service`, `ledger.service`, …). There is
  **no separate `-data.service` tier** — a service owns both its logic and its own DB access. (The backend
  ARCHITECTURE.md still describes a two-tier orchestration/data split; that was the original intent but is
  not how the code is organized — concern-split is the standard.)
- **Controllers stay thin** — HTTP + validation only; delegate to services.
- **Every multi-write uses a `QueryRunner` transaction**, inline in the service that owns the write
  (`LedgerService.post` is the canonical example) — lock contended rows in a stable order.
- A service may call other modules' services via DI + module exports; keep the dependency direction acyclic.
- Always scope DB queries to the current user.
- Never let one failure crash the request — wrap external/provider calls in try/catch.

### API Response Envelope
Every endpoint returns `ApiResponse<T>`:
```typescript
{ success: true, message: "...", data: T, timestamp: "...", traceId: "..." }
{ success: false, message: "...", error: { code: "...", detail: "..." }, timestamp: "...", traceId: "..." }
```

### Entity Rules
- All entities use `@PrimaryGeneratedColumn('uuid')`
- Timestamps: `@CreateDateColumn()` and `@UpdateDateColumn()`
- Contended entities (Ride, Carpool, ShuttleTrip): `@VersionColumn()` for optimistic locking
- Money columns: `bigint` type (kobo). Never store naira as decimal.
- Relations: always define both sides. Cascade deletes only where semantically correct.

### Guard / pipeline stack
Global (`APP_GUARD` / `APP_*` in `app.module.ts`) — applied to **every** request:
```
JwtAuthGuard (GLOBAL; @Public() opts out) + ThrottlerGuard (GLOBAL)
  -> global ValidationPipe -> [controller] -> ResponseEnvelopeInterceptor -> AllExceptionsFilter
```
Per-controller: `RolesGuard` (`@UseGuards` + `@Roles`), and `PermissionsGuard` (`@RequirePermissions`) on admin routes.

### Auth & Security
- **Passwords: scrypt** (Node built-in, no native dependency), stored `salt:hash` (hex), constant-time compare (`auth/services/password.service.ts`). This is the **canonical choice — not Argon2id** (the docs' Argon2id claim was aspirational). ⚠️ The call uses Node's default cost (N=2¹⁴); raise to current OWASP guidance (N ≥ 2¹⁷) — tracked for P7.
- **JWT:** self-issued, access 15m + rotating refresh 30d. Never log tokens, passwords, or full card numbers.
- **OTP / auth endpoints** are rate-limited via `@nestjs/throttler`.
- **NIN is sensitive PII** — encrypt at rest, never log, never place in URLs or query strings.

---

## Mobile Apps (Expo / React Native)

### Routing
- File-based routing via Expo Router v6
- Route groups: `(auth)/`, `(onboarding)/`, `(tabs)/`
- Flow screens: `book.tsx`, `ride/[id].tsx`, `ride-history.tsx`
- Three-way gate pattern: unauthenticated -> auth flow; authenticated + !onboarded -> onboarding; ready -> tabs

### State Management
- **Zustand** for client state (auth tokens, current ride, UI state)
- **TanStack Query** for server state (cached API responses)
- Never mix: Zustand stores don't fetch; TanStack Query doesn't hold client-only state

### API Client
- Always use `apiFetch()` from `@kari/mobile-core` — handles Bearer tokens, refresh, error unwrapping
- Endpoint definitions live in each app's `src/api/endpoints.ts`
- Never call `fetch` directly from screens

### Socket.IO
- Socket singleton from `@kari/mobile-core`
- Connect with JWT on `auth` handshake event
- Driver-specific: `useDriverDispatch` hook mounted in tabs layout
- Rider-specific: ride store subscribes to ride-scoped events

### Component Rules
- Import shared primitives from `@kari/mobile-core` (Screen, KariButton, InputField, etc.)
- App-specific components in each app's `src/components/`
- Every screen wrapped in `<Screen>` (safe area + keyboard avoidance)
- All styling via NativeWind — never use `StyleSheet.create` for colors/spacing

### Store Pattern
```typescript
import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  // ... state
  setTokens: (access: string, refresh: string) => void;
  // ... actions
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  setTokens: (access, refresh) => {
    // persist to SecureStore
    set({ accessToken: access });
  },
}));
```

---

## Admin (Next.js)

### Auth
- httpOnly cookie stores JWT — never exposed to client JS
- All backend requests go through `/api/proxy/[...path]` (injects Bearer)
- `middleware.ts` gates authenticated routes
- RBAC: `<Can permission="...">` component + `useCan()` hook, backed by `@kari/types/rbac.ts`

### Component Rules
- Server Components by default
- `"use client"` only for interactivity (state, effects, event handlers)
- Data fetching in Server Components — never in Client Components
- Dark theme with Kari brand tokens

---

## Shared Packages

### @kari/types
- Enums, API contracts, RBAC definitions
- **Must rebuild after editing:** `pnpm --filter @kari/types run build`
- Both backend and mobile consume the built `dist/`, not source

### @kari/mobile-core
- Source-shipped (no build step) — Expo apps transform via Metro/Babel
- Exports: API client, socket, theme tokens, Tailwind preset, 10 UI primitives
- Each consumer app's `tailwind.config.js`: `presets: [require('nativewind/preset'), require('@kari/mobile-core/tailwind-preset')]`
- Content glob: `../packages/mobile-core/src/**`

---

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Backend modules | kebab-case folders | `money/`, `ride-variants/` |
| Backend files | kebab-case | `money-data.service.ts`, `create-ride.dto.ts` |
| Entities | kebab-case, singular | `ride.entity.ts`, `wallet.entity.ts` |
| Mobile screens | kebab-case (Expo Router convention) | `ride-history.tsx`, `[id].tsx` |
| Mobile components | PascalCase | `IncomingRequest.tsx`, `SwipeToAccept.tsx` |
| Shared types | camelCase | `enums.ts`, `rbac.ts` |
| Admin pages | kebab-case (Next.js convention) | `users/page.tsx` |

---

## Error Handling

- Backend: AllExceptionsFilter normalizes all errors to ApiResponse envelope
- Backend services: never throw raw errors — wrap in domain-specific exceptions
- Mobile: `apiFetch` throws `ApiError` with typed code/detail — catch in stores or components
- Admin: try/catch in Server Components, error.tsx boundaries for pages
- Console errors always include context: `[module/function]`
- User-facing errors must be human readable — never expose raw messages

---

## Environment Variables

### Backend (.env)
```
NODE_ENV, PORT, APP_NAME, LOG_LEVEL, CORS_ORIGINS
POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
DB_SYNCHRONIZE (true in dev only), DB_LOGGING
REDIS_URL
JWT_ACCESS_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_SECRET, JWT_REFRESH_TTL
PAYSTACK_SECRET_KEY, DOJAH_API_KEY, DOJAH_APP_ID
TERMII_API_KEY, TERMII_SENDER_ID
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET
GOOGLE_MAPS_API_KEY, GOOGLE_OAUTH_CLIENT_IDS
EXPO_ACCESS_TOKEN
```

### Mobile (Expo)
```
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_SOCKET_URL
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
```

### Admin (Next.js)
```
NEXT_PUBLIC_API_URL (proxied through /api/proxy/)
```

All env vars validated at boot (Zod schema for backend, app config for mobile).
Noop providers activate when keys are empty — OTPs logged to console.

---

## Dependencies

Never install a new package without a clear reason. The approved stacks are locked:
- Backend: NestJS ecosystem, TypeORM, BullMQ, Socket.IO, class-validator, pino, Zod (config only)
- Mobile: Expo SDK, NativeWind, Zustand, TanStack Query, expo-camera, expo-location, expo-task-manager
- Admin: Next.js, Tailwind, shadcn/ui, Auth.js patterns (custom JWT)
- Shared: TypeScript, pnpm, Turborepo

Do not add new packages without updating this list.

---

## Local Development

```bash
# Start infrastructure
docker compose up -d  # OR: brew services (Postgres + Redis already running on this machine)

# Backend
pnpm --filter @kari/backend run dev        # http://localhost:3000, Swagger at /docs

# Rider
pnpm --filter @kari/rider exec expo start -c  # Metro :8081

# Driver
pnpm --filter @kari/driver exec expo start -c  # Metro :8081 (stop rider first or use different port)

# Admin
cd admin && CI=1 ../node_modules/.bin/next dev -p 3001  # http://localhost:3001

# Seed admin user
node dist/database/seed-admin.js  # admin@kari.test / AdminPass123!
```

DB/user/pass all `kari`. `DB_SYNCHRONIZE=true` so entity changes auto-apply in dev.
Noop SMS/WhatsApp providers log OTP to backend console — grep the log for codes.
`env.ts` in mobile apps auto-derives API host from Metro's `hostUri`.
