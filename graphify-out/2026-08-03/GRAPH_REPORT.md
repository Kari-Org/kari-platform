# Graph Report - kari-platform  (2026-08-03)

## Corpus Check
- 466 files · ~723,752 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3525 nodes · 7072 edges · 277 communities (197 shown, 80 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f5876fb8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RidesService
- errorMessage
- RiderProfile
- rider/src/api/endpoints.ts
- expo
- CreateTicketDto
- enums.ts
- dependencies
- AppConfig
- icons.tsx
- CurrentUser
- DriverService
- Screen
- Kari Admin Console — ARCHITECTURE.md
- driver/src/api/endpoints.ts
- ResponseMessage
- auth.service.ts
- BaseEntity
- app.module.ts
- devDependencies
- errorMessage
- admin.controller.ts
- admin.service.ts
- subscription-new.tsx
- AuthService
- Code Standards
- devDependencies
- Column
- dependencies
- ride/[id].tsx
- identity.service.ts
- AdminService
- rides.service.ts
- notifications.module.ts
- mobile-core/src/index.ts
- .book
- ride.tsx
- mobile-core/package.json
- Roles
- PaymentProvider
- rider/src/stores/auth.store.ts
- admin-api.ts
- compilerOptions
- colors
- .send
- ReferralsService
- button.tsx
- cn
- shuttle/page.tsx
- WalletController
- compilerOptions
- [...path]/route.ts
- app.controller.ts
- PaymentsService
- GamificationService
- noop.providers.ts
- DriverController
- NotificationsController
- compilerOptions
- scripts
- RiderController
- Common Diagnosis Patterns
- CarpoolsController
- .subscribe
- Library Docs
- Public
- pricing.service.ts
- LedgerService
- PlacesController
- SafetyController
- tasks
- API Inventory
- audit.interceptor.ts
- AvailabilityController
- tickets/page.tsx
- PasswordService
- contracts.ts
- Entries
- Kari — Foundation
- Kari Driver App — Architecture & Design
- dependencies
- dependencies
- compilerOptions
- types/package.json
- Kari Rider App — Architecture & Design
- 0001. Driver carpool mode toggle
- driver/src/stores/auth.store.ts
- Web (Marketing Site) Context
- Kari Backend — Architecture
- Design Tokens
- Project Overview
- 0002. Shuttle ops route assignment
- expo
- driver/app/(tabs)/home.tsx
- compilerOptions
- compilerOptions
- scripts
- MapsProvider
- SubscriptionsService
- Provider Docs
- Slice B1 — Carpool v2: driver carpool-mode toggle (BEFORE, no graph)
- carpool.tsx
- include
- include
- configuration.ts
- GamificationController
- LivenessProvider
- Architecture
- By group (entity → its FK columns → target)
- CreateCarpoolDto
- VehicleDto
- driver/package.json
- rider/package.json
- .webhook
- SafetyService
- RealtimeGateway
- .share
- Build Graph
- deploy
- rider/src/theme/tokens.ts
- rider/context/README.md
- admins/page.tsx
- CreateDedicatedDriverDto
- payments.service.ts
- WalletService
- exclude
- earnings.tsx
- devDependencies
- DriverQuizDto
- DriverDetailsDto
- TipRideDto
- Database Entity Groups
- permissions
- ios
- Driver App Context
- rider/app/(tabs)/_layout.tsx
- live/page.tsx
- public.decorator.ts
- LoginDto
- EmergencyContactDto
- PanicDto
- TripShareController
- Technical Grounding (the trailer)
- driver/app/rewards.tsx
- driver/app/support.tsx
- devDependencies
- rider/app/shuttle.tsx
- wallet.tsx
- Kari — Agent context
- nest-cli.json
- .fleet
- ForgotPasswordDto
- IdentityProvider
- Deploying the Kari backend (Railway)
- Screen Catalog
- Zustand Stores
- UI Registry
- driver/metro.config.js
- Kari Platform
- Rider App Context
- Screen Catalog
- rider/metro.config.js
- Backend Context
- backend/package.json
- @kari/backend
- .earnings
- Kari — Logo & App Icon Kit
- android
- extra
- Zustand Stores
- admin/app/layout.tsx
- 5. System Architecture
- Module Catalog
- plugins
- splash
- web/app/layout.tsx
- QueueModule
- RedisModule
- rider/src/stores/ride.store.ts
- admin/next.config.ts
- admin/postcss.config.mjs
- admin/tailwind.config.ts
- bullmq
- helmet
- ioredis
- @kari/types
- @nestjs/bullmq
- @nestjs/common
- @nestjs/jwt
- @nestjs/passport
- nestjs-pino
- @nestjs/platform-express
- @nestjs/platform-socket.io
- @nestjs/typeorm
- @nestjs/websockets
- rxjs
- typeorm
- CLAUDE.md
- runtimeVersion
- expo-camera
- expo-constants
- expo-dev-client
- @expo-google-fonts/hanken-grotesk
- expo-linking
- expo-location
- expo-notifications
- expo-secure-store
- expo-splash-screen
- expo-system-ui
- expo-task-manager
- expo-updates
- @gorhom/bottom-sheet
- @kari/mobile-core
- @kari/types
- react
- react-native
- @react-native-async-storage/async-storage
- react-native-gesture-handler
- react-native-maps
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- socket.io-client
- @tanstack/react-query
- zustand
- expo-web-browser
- expo
- expo-constants
- @expo-google-fonts/geist-mono
- @expo-google-fonts/hanken-grotesk
- expo-linking
- expo-location
- expo-router
- expo-secure-store
- expo-splash-screen
- expo-status-bar
- expo-system-ui
- expo-updates
- @gorhom/bottom-sheet
- @kari/mobile-core
- nativewind
- react
- react-native
- @react-native-async-storage/async-storage
- react-native-gesture-handler
- react-native-maps
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- socket.io-client
- zustand
- web/next.config.ts
- web/postcss.config.mjs
- web/tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `ResponseMessage()` - 138 edges
2. `CurrentUser` - 94 edges
3. `BaseEntity` - 62 edges
4. `colors` - 58 edges
5. `errorMessage()` - 47 edges
6. `Roles()` - 41 edges
7. `Screen()` - 40 edges
8. `Column` - 39 edges
9. `KariButton()` - 39 edges
10. `AppConfig` - 32 edges

## Surprising Connections (you probably didn't know these)
- `AuditLog` --references--> `Column`  [EXTRACTED]
  backend/src/admin/audit/entities/audit-log.entity.ts → admin/components/ui/data-table.tsx
- `Carpool` --references--> `Column`  [EXTRACTED]
  backend/src/carpools/entities/carpool.entity.ts → admin/components/ui/data-table.tsx
- `CarpoolMember` --references--> `Column`  [EXTRACTED]
  backend/src/carpools/entities/carpool-member.entity.ts → admin/components/ui/data-table.tsx
- `ChatMessage` --references--> `Column`  [EXTRACTED]
  backend/src/comms/entities/chat-message.entity.ts → admin/components/ui/data-table.tsx
- `DriverProfile` --references--> `Column`  [EXTRACTED]
  backend/src/driver/entities/driver-profile.entity.ts → admin/components/ui/data-table.tsx

## Import Cycles
- None detected.

## Communities (277 total, 80 thin omitted)

### Community 0 - "RidesService"
Cohesion: 0.06
Nodes (23): CarpoolsService, haversineKm(), JOINABLE, Injectable, RateRideDto, ApiProperty, ApiPropertyOptional, IsInt (+15 more)

### Community 1 - "errorMessage"
Cohesion: 0.12
Nodes (25): InputField(), KariButton(), expo-web-browser, ForgotPassword(), extra, extra, SignUp(), VerifyMethod() (+17 more)

### Community 2 - "RiderProfile"
Cohesion: 0.07
Nodes (32): RiderPreferencesDto, ApiPropertyOptional, IsBoolean, IsEnum, IsOptional, IsString, MaxLength, RiderProfileDto (+24 more)

### Community 3 - "rider/src/api/endpoints.ts"
Cohesion: 0.07
Nodes (43): QUICK_REPLIES, naira(), RideHistory(), Coords, { height: H }, RidesBooking(), TERMINAL, commsApi (+35 more)

### Community 4 - "expo"
Cohesion: 0.04
Nodes (47): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, projectId, typedRoutes, expo (+39 more)

### Community 5 - "CreateTicketDto"
Cohesion: 0.07
Nodes (31): CreateTicketDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, IsString, IsUUID, MaxLength (+23 more)

### Community 6 - "enums.ts"
Cohesion: 0.04
Nodes (40): ApiError, ApiResponse, GeoPoint, Paginated, AccessibilityNeed, AchievementBadge, AddressLabel, BehaviorPreference (+32 more)

### Community 7 - "dependencies"
Cohesion: 0.04
Nodes (44): dependencies, class-variance-authority, clsx, @kari/types, lucide-react, next, react, react-dom (+36 more)

### Community 8 - "AppConfig"
Cohesion: 0.09
Nodes (23): AppModule, Module, JwtStrategy, Inject, Injectable, GoogleProfile, TokenPair, JwtPayload (+15 more)

### Community 9 - "icons.tsx"
Cohesion: 0.08
Nodes (30): NAV, NavGroup, NavItem, Route(), ArrowRight(), ArrowRightUp(), Bus(), CalendarMark() (+22 more)

### Community 10 - "CurrentUser"
Cohesion: 0.12
Nodes (18): CurrentUser, ROLES_KEY, RolesGuard, Injectable, AuthUser, NinDto, ApiProperty, Matches (+10 more)

### Community 11 - "DriverService"
Cohesion: 0.10
Nodes (18): DriverOnboardingService, scorePersonality(), Injectable, DriverService, Injectable, InjectRepository, DriverPersonalDto, ApiProperty (+10 more)

### Community 12 - "Screen"
Cohesion: 0.08
Nodes (27): SLIDES, { width }, OptionRow(), Props, Screen(), ScreenHeader(), CarpoolScreen(), naira() (+19 more)

### Community 13 - "Kari Admin Console — ARCHITECTURE.md"
Cohesion: 0.05
Nodes (36): Audit logging, Information architecture (collapsible sidebar), Kari Admin Console — ARCHITECTURE.md, Local dev, Locked decisions (2026-06), Module specs (functionality × backend reality), Permission model (`@kari/types/rbac.ts`) — the contract, Phased plan (+28 more)

### Community 14 - "driver/src/api/endpoints.ts"
Cohesion: 0.09
Nodes (33): ICON, SafetyScreen(), day(), time(), TripCard(), notificationsApi, safetyApi, shuttleApi (+25 more)

### Community 15 - "ResponseMessage"
Cohesion: 0.20
Nodes (17): AdminController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+9 more)

### Community 16 - "auth.service.ts"
Cohesion: 0.10
Nodes (23): GoogleAuthDto, ApiProperty, IsString, MinLength, RefreshDto, ApiProperty, IsString, ResetPasswordDto (+15 more)

### Community 17 - "BaseEntity"
Cohesion: 0.11
Nodes (25): BaseEntity, bigintNumber, LedgerEntry, Entity, Entity, VersionColumn, Wallet, PostArgs (+17 more)

### Community 18 - "app.module.ts"
Cohesion: 0.11
Nodes (30): AdminModule, Module, AuthModule, Module, CarpoolsModule, Module, DriverModule, Module (+22 more)

### Community 19 - "devDependencies"
Cohesion: 0.05
Nodes (37): devDependencies, eslint, eslint-config-prettier, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, pino-pretty (+29 more)

### Community 20 - "errorMessage"
Cohesion: 0.10
Nodes (20): Otp(), SignIn(), SignUp(), VerifyMethod(), CATEGORIES, Onboarding(), QUIZ, SCALE (+12 more)

### Community 21 - "admin.controller.ts"
Cohesion: 0.07
Nodes (25): AdminCancelRideDto, ApiPropertyOptional, IsOptional, IsString, MaxLength, SetShuttleAssignmentDto, ApiProperty, ApiPropertyOptional (+17 more)

### Community 22 - "admin.service.ts"
Cohesion: 0.10
Nodes (19): ACTIVE_DRIVING, ACTIVE_RIDE_STATUSES, Page, Inject, InjectRepository, CommsModule, Module, Inject (+11 more)

### Community 23 - "subscription-new.tsx"
Cohesion: 0.11
Nodes (24): Coords, NewSubscription(), TimeChips(), IconName, SubscriptionsScreen(), Home(), Promo, PROMOS (+16 more)

### Community 24 - "AuthService"
Cohesion: 0.10
Nodes (14): AuthService, toPublic(), Injectable, SignUpDto, ApiProperty, ApiPropertyOptional, IsEmail, IsEnum (+6 more)

### Community 25 - "Code Standards"
Cohesion: 0.06
Nodes (33): Admin (Next.js), Admin (Next.js), API Client, API Response Envelope, Auth, Auth & Security, Backend (.env), Backend (NestJS) (+25 more)

### Community 26 - "devDependencies"
Cohesion: 0.06
Nodes (33): dependencies, @kari/types, next, react, react-dom, devDependencies, autoprefixer, postcss (+25 more)

### Community 27 - "Column"
Cohesion: 0.11
Nodes (21): Column, Document, Entity, ShuttleBooking, Entity, ShuttleRoute, Entity, ShuttleStop (+13 more)

### Community 28 - "dependencies"
Cohesion: 0.06
Nodes (33): dependencies, class-transformer, class-validator, dotenv, google-auth-library, @nestjs/core, @nestjs/swagger, @nestjs/throttler (+25 more)

### Community 29 - "ride/[id].tsx"
Cohesion: 0.09
Nodes (24): Checkbox(), Book(), CAR, CLASS_META, formatTrip(), { height: SCREEN_H }, naira(), PAYMENTS (+16 more)

### Community 30 - "identity.service.ts"
Cohesion: 0.09
Nodes (17): ApiBody, ApiConsumes, IdentityController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get (+9 more)

### Community 31 - "AdminService"
Cohesion: 0.08
Nodes (11): AdminService, startOfToday(), stripPin(), Injectable, CreateAdminDto, ApiProperty, IsEmail, IsEnum (+3 more)

### Community 32 - "rides.service.ts"
Cohesion: 0.09
Nodes (19): CARPOOL_MAX_SEATS, InjectDataSource, InjectRepository, Carpool, Entity, VersionColumn, CarpoolMember, Entity (+11 more)

### Community 33 - "notifications.module.ts"
Cohesion: 0.11
Nodes (19): DeviceToken, Entity, Notification, Entity, NotificationsModule, Module, NotificationsProcessor, Inject (+11 more)

### Community 34 - "mobile-core/src/index.ts"
Cohesion: 0.10
Nodes (15): ChatScreen(), commsApi, ApiError, apiFetch(), refreshTokens(), RequestOptions, ApiConfig, config (+7 more)

### Community 35 - ".book"
Cohesion: 0.10
Nodes (20): BookShuttleDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Max, Min (+12 more)

### Community 36 - "ride.tsx"
Cohesion: 0.14
Nodes (16): DriverRideScreen(), naira(), TERMINAL, TabsLayout(), Ride, IncomingRequest(), naira(), SwipeToAccept() (+8 more)

### Community 37 - "mobile-core/package.json"
Cohesion: 0.07
Nodes (28): @expo/vector-icons, dependencies, @kari/types, socket.io-client, devDependencies, typescript, expo-router, @kari/types (+20 more)

### Community 38 - "Roles"
Cohesion: 0.22
Nodes (15): Roles(), StartRideDto, ApiProperty, Matches, RidesController, ApiBearerAuth, ApiOperation, ApiTags (+7 more)

### Community 39 - "PaymentProvider"
Cohesion: 0.11
Nodes (10): ChargeInput, ChargeResult, ChargeStatus, PaymentProvider, TransferInput, TransferResult, NoopPaymentProvider, mapStatus() (+2 more)

### Community 40 - "rider/src/stores/auth.store.ts"
Cohesion: 0.10
Nodes (16): Otp(), SignIn(), styles, RootLayout(), Account(), IconName, RowItem, queryClient (+8 more)

### Community 41 - "admin-api.ts"
Cohesion: 0.09
Nodes (21): EMPTY, AdminDriverRow, AdminUserRow, AuditEntry, CreateDedicatedDriverBody, FareConfig, FinanceSummary, Fleet (+13 more)

### Community 42 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 43 - "colors"
Cohesion: 0.15
Nodes (16): Props, Props, Props, formatLocal(), PhoneInput(), Props, toLocalDigits(), Props (+8 more)

### Community 44 - ".send"
Cohesion: 0.11
Nodes (17): CommsController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+9 more)

### Community 45 - "ReferralsService"
Cohesion: 0.09
Nodes (17): ApplyReferralDto, ApiProperty, IsString, ReferralsController, ApiBearerAuth, ApiOperation, ApiTags, Body (+9 more)

### Community 46 - "button.tsx"
Cohesion: 0.15
Nodes (15): DashLayout(), SettingsPage(), KariMark(), SessionContext, SessionProvider(), useSession(), Sidebar(), Topbar() (+7 more)

### Community 47 - "cn"
Cohesion: 0.19
Nodes (18): ACTIONS, AuditPage(), DashboardPage(), naira(), PayoutsPage(), STATUS_TONE, STATUS_TONE, STATUSES (+10 more)

### Community 48 - "shuttle/page.tsx"
Cohesion: 0.20
Nodes (11): FareConfigPage(), naira(), naira(), RevenuePage(), ROLES, PageHeader(), Card(), CardContent() (+3 more)

### Community 49 - "WalletController"
Cohesion: 0.11
Nodes (19): PayoutDto, ApiProperty, IsInt, Min, TopupDto, ApiProperty, IsInt, Min (+11 more)

### Community 50 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowJs, incremental, isolatedModules, jsx, lib, module, moduleResolution (+16 more)

### Community 51 - "[...path]/route.ts"
Cohesion: 0.14
Nodes (14): Ctx, DELETE(), forward(), GET(), PATCH(), POST(), PUT(), ADMIN_COOKIE (+6 more)

### Community 52 - "app.controller.ts"
Cohesion: 0.11
Nodes (13): AppController, ApiTags, Controller, Get, RESPONSE_MESSAGE_KEY, AllExceptionsFilter, codeForStatus(), STATUS_CODE (+5 more)

### Community 53 - "PaymentsService"
Cohesion: 0.21
Nodes (3): PaymentsService, toKobo(), Injectable

### Community 54 - "GamificationService"
Cohesion: 0.15
Nodes (10): Achievement, Entity, DriverScore, Entity, GamificationService, RIDE_MILESTONES, Inject, Injectable (+2 more)

### Community 55 - "noop.providers.ts"
Cohesion: 0.13
Nodes (14): Inject, DeliveryResult, MaskedCallInput, MaskedCallResult, PushInput, SendEmailInput, SendMessageInput, VoiceProvider (+6 more)

### Community 56 - "DriverController"
Cohesion: 0.18
Nodes (13): DriverController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+5 more)

### Community 57 - "NotificationsController"
Cohesion: 0.10
Nodes (16): RegisterDeviceDto, ApiProperty, ApiPropertyOptional, IsOptional, IsString, NotificationsController, ApiBearerAuth, ApiOperation (+8 more)

### Community 58 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, baseUrl, declaration, lib, module, moduleResolution, noUnusedLocals, noUnusedParameters (+14 more)

### Community 59 - "scripts"
Cohesion: 0.09
Nodes (22): devDependencies, prettier, turbo, typescript, engines, node, turbo, typescript (+14 more)

### Community 60 - "RiderController"
Cohesion: 0.16
Nodes (14): RiderLivenessDto, ApiProperty, IsString, MinLength, RiderController, ApiBearerAuth, ApiOperation, ApiTags (+6 more)

### Community 61 - "Common Diagnosis Patterns"
Cohesion: 0.09
Nodes (21): Admin Auth Issues, Admin Data Pages (A2–A6), Backend API Testing (curl), Backend Not Starting, Before Debugging Anything, Common Diagnosis Patterns, Database Quick Queries, Debug Guide (+13 more)

### Community 62 - "CarpoolsController"
Cohesion: 0.24
Nodes (12): CarpoolsController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+4 more)

### Community 63 - ".subscribe"
Cohesion: 0.13
Nodes (14): SubscribeDto, ApiProperty, IsString, SubscriptionsController, ApiBearerAuth, ApiOperation, ApiTags, Body (+6 more)

### Community 64 - "Library Docs"
Cohesion: 0.10
Nodes (21): Authority Order, Backend — emit via `RealtimeService` (not the gateway directly), Backend (MapsProvider — full contract in provider-docs.md), BullMQ (Backend), Entity Definition, Expo Router v6 (Mobile), File-based Routing, Google Maps (Backend + Mobile) (+13 more)

### Community 65 - "Public"
Cohesion: 0.30
Nodes (10): AuthController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+2 more)

### Community 66 - "pricing.service.ts"
Cohesion: 0.12
Nodes (13): OtpSendResult, REDIS_CLIENT, QuoteDto, ApiProperty, ApiPropertyOptional, IsNumber, IsOptional, IsString (+5 more)

### Community 67 - "LedgerService"
Cohesion: 0.13
Nodes (9): Transaction, Entity, LedgerService, Injectable, InjectDataSource, InjectRepository, Inject, InjectRepository (+1 more)

### Community 68 - "PlacesController"
Cohesion: 0.16
Nodes (12): PlacesController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get, Query, PlacesModule (+4 more)

### Community 69 - "SafetyController"
Cohesion: 0.15
Nodes (11): SafetyController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+3 more)

### Community 70 - "tasks"
Cohesion: 0.12
Nodes (19): ^build, coverage/**, dependsOn, outputs, cache, persistent, dist/**, dependsOn (+11 more)

### Community 71 - "API Inventory"
Cohesion: 0.11
Nodes (19): Admin — `/admin` (ADMIN + `PermissionsGuard`), API Inventory, Auth — `/auth` (all `@Public` except `/me`), Availability — `/availability` (DRIVER), Carpools — `/carpools`, Comms — under `/rides` · participants only, Drivers — `/drivers` (DRIVER), Engagement (+11 more)

### Community 72 - "audit.interceptor.ts"
Cohesion: 0.15
Nodes (10): AUDIT_ACTION, AuditInterceptor, REDACT, sanitize(), Injectable, AuditService, Injectable, InjectRepository (+2 more)

### Community 73 - "AvailabilityController"
Cohesion: 0.18
Nodes (14): AvailabilityController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, HttpCode, Post (+6 more)

### Community 74 - "tickets/page.tsx"
Cohesion: 0.15
Nodes (14): DedicatedDriversPage(), ShuttlePage(), FILTERS, STATUS_TONE, TicketsPage(), ACTIVE, naira(), STATUS_TONE (+6 more)

### Community 75 - "PasswordService"
Cohesion: 0.13
Nodes (9): GoogleAuthService, Inject, Injectable, PasswordService, scrypt, Injectable, TokenService, Inject (+1 more)

### Community 76 - "contracts.ts"
Cohesion: 0.18
Nodes (16): EMAIL_PROVIDER, IDENTITY_PROVIDER, LIVENESS_PROVIDER, MAPS_PROVIDER, PAYMENT_PROVIDER, PUSH_PROVIDER, SMS_PROVIDER, STORAGE_PROVIDER (+8 more)

### Community 77 - "Entries"
Cohesion: 0.11
Nodes (18): chore · infra · Railway backend deploy + EAS build pipeline — 2026-06-08/09, docs · context · Context system rebuilt around foundation.md — 2026-07-30, docs · context · Cross-cutting + per-product context system — 2026-06-17, Entries, feature · admin · A2–A6: live fleet, actions+audit, dedicated drivers, tickets, financials — 2026-06-05, feature · admin · Admins & Roles page — 2026-06-23, feature · backend+driver · Carpool v2: driver carpool-mode toggle (spec 0001) — 2026-08-03, feature · backend · OTP on re-login (2FA) + longer-lived sessions — 2026-06-18 (+10 more)

### Community 78 - "Kari — Foundation"
Cohesion: 0.12
Nodes (17): §0 Build constraints, §10 Known scale seams, §11 The deepest risk, §12 Open questions, §1 What it is, §2 Who it's for, §3 Success & stage, §4 Guiding principles (+9 more)

### Community 79 - "Kari Driver App — Architecture & Design"
Cohesion: 0.12
Nodes (17): 10. Maps & Location (the defining driver concern), 11. Design System, 12. Screen Inventory (driver, union of legacy flows, on real data), 13. Cross-Cutting Concerns, 14. Requirements Traceability (driver-facing), 15. Decisions Log, 16. Build Plan (mirrors the backend & rider phases), 1. Purpose & Goals (+9 more)

### Community 80 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, expo, expo-font, @expo-google-fonts/geist-mono, expo-router, expo-status-bar, nativewind, react-native-otp-entry (+9 more)

### Community 81 - "dependencies"
Cohesion: 0.12
Nodes (17): expo-auth-session, dependencies, expo-auth-session, expo-camera, expo-font, expo-notifications, @kari/types, react-native-otp-entry (+9 more)

### Community 82 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, baseUrl, esModuleInterop, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 83 - "types/package.json"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, exports, files, dist, typescript, main, name (+8 more)

### Community 84 - "Kari Rider App — Architecture & Design"
Cohesion: 0.12
Nodes (17): 10. Maps & Location, 11. Design System, 12. Screen Inventory (union of both apps, on real data), 13. Cross-Cutting Concerns, 14. Requirements Traceability (rider-facing), 15. Decisions Log, 16. Build Plan (mirrors the backend phases), 1. Purpose & Goals (+9 more)

### Community 85 - "0001. Driver carpool mode toggle"
Cohesion: 0.12
Nodes (15): 0001. Driver carpool mode toggle, Build plan, Consequences, Context, Decision, Feature design, Follow-up, Option 1: Persist carpool mode on `driver_profiles` (a boolean column), filter in `findCandidates` via an options argument (+7 more)

### Community 86 - "driver/src/stores/auth.store.ts"
Cohesion: 0.17
Nodes (10): RootLayout(), queryClient, AuthTokens, PublicUser, env, extra, cache, secureStorage (+2 more)

### Community 87 - "Web (Marketing Site) Context"
Cohesion: 0.13
Nodes (13): Design System (web), Fonts (self-hosted variable, `public/fonts`), Key tokens, The divergence (read first), Type scale (semantic classes), ⚠ Design-token divergence (important), Files, Stack (+5 more)

### Community 88 - "Kari Backend — Architecture"
Cohesion: 0.13
Nodes (15): 10. External Integrations (behind interfaces), 11. Non-Functional Requirements (mapped), 12. Requirements Traceability, 13. Decisions Log, 1. Purpose & Goals, 2. Lineage — What We Carry Forward, 3. Technology Stack, 4. Architectural Principles (+7 more)

### Community 89 - "Design Tokens"
Cohesion: 0.13
Nodes (14): Admin Dashboard, Brand Assets, Brand Colors, Colors, Design Principles (Mobile), Design Tokens, Fonts, Invariants (+6 more)

### Community 90 - "Project Overview"
Cohesion: 0.13
Nodes (15): 1. Solo — freelance drivers only (for now), 2. Carpool — freelance, opt-in, 1–3 riders, 3. Shuttle — dedicated drivers on fixed routes, 4. Subscription — sticky dedicated driver, with fallback, Admin / Operations, Built for Nigeria, Cross-cutting rules, Driver (dedicated) (+7 more)

### Community 91 - "0002. Shuttle ops route assignment"
Cohesion: 0.13
Nodes (14): 0002. Shuttle ops route assignment, Build plan, Consequences, Context, Decision, Feature design, Follow-up, Option 1: Standing assignment on the route, trips inherit (+6 more)

### Community 92 - "expo"
Cohesion: 0.13
Nodes (14): typedRoutes, expo, backgroundColor, experiments, icon, name, newArchEnabled, orientation (+6 more)

### Community 93 - "driver/app/(tabs)/home.tsx"
Cohesion: 0.24
Nodes (12): ACTIVE, Home(), LAGOS, naira(), naira(), Trips(), availabilityApi, ridesApi (+4 more)

### Community 94 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, composite, declarationMap, lib, module, moduleResolution, outDir, rootDir (+6 more)

### Community 95 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, noFallthroughCasesInSwitch, noImplicitReturns (+6 more)

### Community 96 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, lint, migration:generate, migration:revert, migration:run, start (+5 more)

### Community 97 - "MapsProvider"
Cohesion: 0.17
Nodes (6): Inject, MapsProvider, TripEstimate, TripQuery, haversineMetres(), NoopMapsProvider

### Community 98 - "SubscriptionsService"
Cohesion: 0.32
Nodes (5): planById(), SUBSCRIPTION_PLANS, SubscriptionPlan, SubscriptionsService, Injectable

### Community 99 - "Provider Docs"
Cohesion: 0.15
Nodes (13): AWS Rekognition (Liveness), AWS S3 (Storage), AWS SES (Email) — planned, Dojah (Identity / NIN), Expo Push / FCM (Push) — planned, Google Maps (Maps), Paystack (Payments) — the only live provider, Provider Architecture (+5 more)

### Community 100 - "Slice B1 — Carpool v2: driver carpool-mode toggle (BEFORE, no graph)"
Cohesion: 0.15
Nodes (12): Design outcome, Design outcome, Develop step — measured, Develop step — measured, Explore step (architect phase) — measured, Explore step (architect phase) — measured, Graphify before/after study — running log, Phase 0 — Orientation & baseline setup (2026-08-03) (+4 more)

### Community 101 - "carpool.tsx"
Cohesion: 0.23
Nodes (10): ActiveCarpool(), CarpoolScreen(), naira(), OfferCard(), STATUS_META, TERMINAL, carpoolsApi, Carpool (+2 more)

### Community 102 - "include"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, paths, strict, extends, include, expo-env.d.ts, expo/tsconfig.base (+4 more)

### Community 103 - "include"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, paths, strict, extends, include, expo-env.d.ts, expo/tsconfig.base (+4 more)

### Community 104 - "configuration.ts"
Cohesion: 0.23
Nodes (6): loadConfiguration(), Env, envSchema, AppDataSource, config, main()

### Community 105 - "GamificationController"
Cohesion: 0.24
Nodes (7): GamificationController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get, UseGuards

### Community 106 - "LivenessProvider"
Cohesion: 0.17
Nodes (6): Inject, InjectRepository, LivenessProvider, PutObjectInput, StorageProvider, NoopStorageProvider

### Community 107 - "Architecture"
Cohesion: 0.17
Nodes (12): Admin -> Backend, Architecture, Authentication, Data Flow Patterns, Invariants, Mobile -> Backend (API call), Monorepo Structure, Provider Abstraction (+4 more)

### Community 108 - "By group (entity → its FK columns → target)"
Cohesion: 0.18
Nodes (11): Admin & Identity, By group (entity → its FK columns → target), Engagement, Entity Relationships, How relations are modeled (important), Money, Ride variants, Rides (+3 more)

### Community 109 - "CreateCarpoolDto"
Cohesion: 0.18
Nodes (10): CreateCarpoolDto, ApiProperty, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsString, Max (+2 more)

### Community 110 - "VehicleDto"
Cohesion: 0.18
Nodes (10): ApiProperty, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsString, Max, Min (+2 more)

### Community 111 - "driver/package.json"
Cohesion: 0.18
Nodes (10): main, name, private, scripts, android, eas-build-post-install, ios, start (+2 more)

### Community 112 - "rider/package.json"
Cohesion: 0.18
Nodes (10): main, name, private, scripts, android, eas-build-post-install, ios, start (+2 more)

### Community 113 - ".webhook"
Cohesion: 0.20
Nodes (8): ApiExcludeEndpoint, PaymentsController, ApiTags, Controller, HttpCode, Post, Headers, Req

### Community 115 - "RealtimeGateway"
Cohesion: 0.22
Nodes (4): RealtimeGateway, Inject, WebSocketGateway, WebSocketServer

### Community 116 - ".share"
Cohesion: 0.29
Nodes (5): ApiOperation, Get, HttpCode, Param, Post

### Community 117 - "Build Graph"
Cohesion: 0.20
Nodes (10): Build Graph, Capabilities & dependency edges, Explicitly out of scope, Layer 0 — foundational prerequisites (all ✅), Real provider implementations (foundation §7 #15 — each independent, slot-in), Ride-variant v2 (the vision gaps — foundation §8 In-scope; contracts in architecture.md → Ride Type Matrix), Standalone (buildable from a cold start, no prerequisites), The keystone unlock (+2 more)

### Community 118 - "deploy"
Cohesion: 0.20
Nodes (9): build, builder, dockerfilePath, deploy, healthcheckPath, healthcheckTimeout, restartPolicyMaxRetries, restartPolicyType (+1 more)

### Community 119 - "rider/src/theme/tokens.ts"
Cohesion: 0.33
Nodes (7): Addresses(), iconFor(), LABELS, titleCase(), PlaceSuggestion, AddressAutocomplete(), Props

### Community 120 - "rider/context/README.md"
Cohesion: 0.27
Nodes (5): App-specific components — `src/components/` (local), Design tokens (summary — full rules in context/design-tokens.md), Layout conventions, Shared primitives — re-exported from `@kari/mobile-core`, UI Registry

### Community 121 - "admins/page.tsx"
Cohesion: 0.25
Nodes (8): AdminsPage(), EMPTY, genPassword(), Input(), ROLES, Select(), AdminAccount, CreateAdminBody

### Community 122 - "CreateDedicatedDriverDto"
Cohesion: 0.22
Nodes (9): CreateDedicatedDriverDto, ApiProperty, ApiPropertyOptional, IsEmail, IsEnum, IsOptional, IsString, Matches (+1 more)

### Community 123 - "payments.service.ts"
Cohesion: 0.22
Nodes (7): CommissionService, Injectable, PostLeg, isCashlike(), RideCancellation, RideSettlement, SettlementResult

### Community 124 - "WalletService"
Cohesion: 0.28
Nodes (3): toNaira(), Injectable, WalletService

### Community 125 - "exclude"
Cohesion: 0.22
Nodes (8): exclude, extends, dist, node_modules, test, **/*.e2e-spec.ts, **/*.spec.ts, ./tsconfig.json

### Community 126 - "earnings.tsx"
Cohesion: 0.28
Nodes (7): EarningsScreen(), naira(), PRESETS, TXN_META, TxnRow(), paymentsApi, walletApi

### Community 127 - "devDependencies"
Cohesion: 0.22
Nodes (9): @expo/ngrok, devDependencies, @babel/core, @expo/ngrok, @types/react, typescript, @babel/core, @types/react (+1 more)

### Community 128 - "DriverQuizDto"
Cohesion: 0.25
Nodes (7): ArrayNotEmpty, DriverQuizDto, ApiProperty, IsInt, Max, Min, IsArray

### Community 129 - "DriverDetailsDto"
Cohesion: 0.25
Nodes (8): DriverDetailsDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString, Matches, MinLength

### Community 130 - "TipRideDto"
Cohesion: 0.25
Nodes (7): TipRideDto, ApiProperty, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsPositive

### Community 132 - "Database Entity Groups"
Cohesion: 0.25
Nodes (8): Admin & Identity, Database Entity Groups, Engagement, Money, Ride Variants, Rides & Matching, Safety & Comms, Users & Profiles

### Community 133 - "permissions"
Cohesion: 0.25
Nodes (8): permissions, android.permission.ACCESS_COARSE_LOCATION, android.permission.ACCESS_FINE_LOCATION, android.permission.CAMERA, android.permission.RECORD_AUDIO, android.permission.ACCESS_BACKGROUND_LOCATION, android.permission.FOREGROUND_SERVICE, android.permission.FOREGROUND_SERVICE_LOCATION

### Community 134 - "ios"
Cohesion: 0.25
Nodes (8): ios, ITSAppUsesNonExemptEncryption, UIBackgroundModes, bundleIdentifier, infoPlist, supportsTablet, fetch, location

### Community 135 - "Driver App Context"
Cohesion: 0.25
Nodes (8): API & socket wiring, App shell & gate, Background location (`src/location/tracker.ts`), Dispatch architecture (the core driver loop), Driver App Context, Files, How the driver app differs from rider, Stack

### Community 136 - "rider/app/(tabs)/_layout.tsx"
Cohesion: 0.36
Nodes (5): TabsLayout(), notificationsApi, DotTabBar(), TABS, registerForPush()

### Community 137 - "live/page.tsx"
Cohesion: 0.33
Nodes (6): AVAIL_TONE, BOUNDS, clamp01(), LiveRidesPage(), Row, FleetDriver

### Community 138 - "public.decorator.ts"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 139 - "LoginDto"
Cohesion: 0.29
Nodes (7): LoginDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, IsString, MinLength

### Community 140 - "EmergencyContactDto"
Cohesion: 0.29
Nodes (7): EmergencyContactDto, ApiProperty, ApiPropertyOptional, IsOptional, IsString, Matches, MaxLength

### Community 141 - "PanicDto"
Cohesion: 0.29
Nodes (6): PanicDto, ApiProperty, ApiPropertyOptional, IsNumber, IsOptional, IsUUID

### Community 142 - "TripShareController"
Cohesion: 0.33
Nodes (5): SharedTripController, TripShareController, ApiBearerAuth, ApiTags, Controller

### Community 143 - "Technical Grounding (the trailer)"
Cohesion: 0.29
Nodes (7): Build status at a glance, Current priorities, Key domain concepts (the vocabulary), Out of scope (current phase), Products, Roadmap (post-MVP), Technical Grounding (the trailer)

### Community 144 - "driver/app/rewards.tsx"
Cohesion: 0.33
Nodes (6): BADGE_META, MEDAL, naira(), RewardsScreen(), gamificationApi, referralsApi

### Community 145 - "driver/app/support.tsx"
Cohesion: 0.33
Nodes (5): CATEGORIES, label(), STATUS_COLOR, SupportScreen(), ticketsApi

### Community 146 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/core, @types/react, typescript, @babel/core, @types/react, typescript

### Community 147 - "rider/app/shuttle.tsx"
Cohesion: 0.38
Nodes (5): naira(), ShuttleScreen(), when(), shuttleApi, ShuttleStop

### Community 148 - "wallet.tsx"
Cohesion: 0.38
Nodes (6): naira(), PRESETS, TXN_META, TxnRow(), WalletScreen(), walletApi

### Community 149 - "Kari — Agent context"
Cohesion: 0.33
Nodes (5): Agent skills, Authority, Context files (read before you build), Kari — Agent context, Standing instructions

### Community 150 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 152 - "ForgotPasswordDto"
Cohesion: 0.33
Nodes (6): ForgotPasswordDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, Matches

### Community 153 - "IdentityProvider"
Cohesion: 0.33
Nodes (3): IdentityProvider, NinVerificationResult, NoopIdentityProvider

### Community 154 - "Deploying the Kari backend (Railway)"
Cohesion: 0.33
Nodes (5): After it's live, Deploying the Kari backend (Railway), Environment variables, One-time setup on Railway, Seed an admin (one-off)

### Community 155 - "Screen Catalog"
Cohesion: 0.33
Nodes (6): `(auth)/` — same flow as rider (no forgot-password screen), Flow & feature screens, `(onboarding)/` — the KYC wizard (hard gate), Root, Screen Catalog, `(tabs)/` — home · trips · account (Expo Tabs + Ionicons; **dispatch mounted here**)

### Community 156 - "Zustand Stores"
Cohesion: 0.33
Nodes (6): `useAuthStore` (auth.store.ts), `useAvailabilityStore` (availability.store.ts), `useCarpoolStore` (carpool.store.ts), `useRideStore` (ride.store.ts), `useSignupDraft` (signup.store.ts), Zustand Stores

### Community 157 - "UI Registry"
Cohesion: 0.33
Nodes (6): App-specific components — `src/components/` (local, driver-only), Design-token compliance ✓, Design tokens, Navigation chrome, Shared primitives — imported from `@kari/mobile-core`, UI Registry

### Community 158 - "driver/metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, path, { withNativeWind }, workspaceRoot

### Community 159 - "Kari Platform"
Cohesion: 0.33
Nodes (6): Common commands, Context system (read before building), Getting started, Kari Platform, Layout, Prerequisites

### Community 160 - "Rider App Context"
Cohesion: 0.33
Nodes (6): API & socket wiring, App shell & gate (`app/_layout.tsx`), Files, Rider App Context, Stack & shape, The `@kari/mobile-core` re-export pattern (important)

### Community 161 - "Screen Catalog"
Cohesion: 0.33
Nodes (6): `(auth)/` — phone-first auth, Flow & feature screens (pushed on the stack), `(onboarding)/` — linear: profile → liveness → preferences, Root, Screen Catalog, `(tabs)/` — home · rides · account (custom `DotTabBar`)

### Community 162 - "rider/metro.config.js"
Cohesion: 0.33
Nodes (5): config, { getDefaultConfig }, path, { withNativeWind }, workspaceRoot

### Community 164 - "Backend Context"
Cohesion: 0.40
Nodes (5): Backend at a glance, Backend Context, Files, Module conventions (as-built), The global request pipeline (every request)

### Community 165 - "backend/package.json"
Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 166 - "@kari/backend"
Cohesion: 0.40
Nodes (4): @kari/backend, Phase 0 status, Run locally, Scripts

### Community 167 - ".earnings"
Cohesion: 0.40
Nodes (4): ApiBearerAuth, ApiOperation, Get, UseGuards

### Community 168 - "Kari — Logo & App Icon Kit"
Cohesion: 0.40
Nodes (4): For Claude Code / developers, Kari — Logo & App Icon Kit, Usage rules (the short version), What's inside

### Community 169 - "android"
Cohesion: 0.40
Nodes (5): backgroundColor, foregroundImage, adaptiveIcon, package, android

### Community 170 - "extra"
Cohesion: 0.40
Nodes (5): projectId, extra, apiBaseUrl, eas, socketUrl

### Community 172 - "Zustand Stores"
Cohesion: 0.40
Nodes (5): `useAuthStore` (auth.store.ts), `useLocationStore` (location.store.ts), `useRideStore` (ride.store.ts), `useSignupDraft` (signup.store.ts), Zustand Stores

### Community 174 - "5. System Architecture"
Cohesion: 0.50
Nodes (4): 5.1 Request path (HTTP), 5.2 Realtime path (WebSocket), 5.3 Matching flow (the core loop), 5. System Architecture

### Community 175 - "Module Catalog"
Cohesion: 0.50
Nodes (4): Dependency notes, Domain modules, Infrastructure modules, Module Catalog

### Community 176 - "plugins"
Cohesion: 0.50
Nodes (4): plugins, expo-font, expo-router, expo-secure-store

### Community 177 - "splash"
Cohesion: 0.50
Nodes (4): splash, backgroundColor, image, resizeMode

### Community 179 - "QueueModule"
Cohesion: 0.67
Nodes (3): QueueModule, Global, Module

### Community 180 - "RedisModule"
Cohesion: 0.67
Nodes (3): RedisModule, Global, Module

## Knowledge Gaps
- **1056 isolated node(s):** `ROLES`, `EMPTY`, `ACTIONS`, `EMPTY`, `BOUNDS` (+1051 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **80 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Index()` connect `Column` to `rides.service.ts`, `notifications.module.ts`, `RiderProfile`, `LedgerService`, `CreateTicketDto`, `audit.interceptor.ts`, `DriverService`, `BaseEntity`, `errorMessage`, `GamificationService`, `admin.service.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `colors` connect `colors` to `errorMessage`, `rider/src/api/endpoints.ts`, `rider/app/(tabs)/_layout.tsx`, `Screen`, `driver/src/api/endpoints.ts`, `driver/app/rewards.tsx`, `driver/app/support.tsx`, `rider/app/shuttle.tsx`, `errorMessage`, `wallet.tsx`, `subscription-new.tsx`, `ride/[id].tsx`, `mobile-core/src/index.ts`, `ride.tsx`, `rider/src/stores/auth.store.ts`, `driver/src/stores/auth.store.ts`, `driver/app/(tabs)/home.tsx`, `carpool.tsx`, `rider/src/theme/tokens.ts`, `earnings.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `Column` connect `Column` to `rides.service.ts`, `notifications.module.ts`, `RiderProfile`, `LedgerService`, `CreateTicketDto`, `audit.interceptor.ts`, `live/page.tsx`, `admin-api.ts`, `tickets/page.tsx`, `DriverService`, `cn`, `shuttle/page.tsx`, `BaseEntity`, `admin.service.ts`, `GamificationService`, `admins/page.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `ROLES`, `EMPTY`, `ACTIONS` to the rest of the system?**
  _1056 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RidesService` be split into smaller, more focused modules?**
  _Cohesion score 0.062004662004662 - nodes in this community are weakly interconnected._
- **Should `errorMessage` be split into smaller, more focused modules?**
  _Cohesion score 0.12408163265306123 - nodes in this community are weakly interconnected._
- **Should `RiderProfile` be split into smaller, more focused modules?**
  _Cohesion score 0.06717687074829932 - nodes in this community are weakly interconnected._