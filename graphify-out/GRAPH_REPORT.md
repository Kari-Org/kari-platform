# Graph Report - kari-platform  (2026-08-03)

## Corpus Check
- 467 files · ~726,708 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3551 nodes · 7065 edges · 271 communities (188 shown, 83 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e14893b1`
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
- app.module.ts
- icons.tsx
- Roles
- DriverService
- CarpoolsService
- Kari Admin Console — ARCHITECTURE.md
- driver/src/api/endpoints.ts
- ResponseMessage
- auth.service.ts
- BaseEntity
- Column
- devDependencies
- mobile-core/src/index.ts
- SetShuttleAssignmentDto
- UsersService
- subscription-new.tsx
- AuthService
- Code Standards
- devDependencies
- PaymentsService
- dependencies
- ride/[id].tsx
- IdentityService
- AdminService
- rides.service.ts
- User
- rider/app/chat/[rideId].tsx
- .book
- ride.tsx
- mobile-core/package.json
- RidesController
- PaymentProvider
- rider/src/stores/auth.store.ts
- admin-api.ts
- compilerOptions
- colors
- comms.controller.ts
- ReferralsService
- button.tsx
- cn
- shuttle/page.tsx
- WalletController
- compilerOptions
- [...path]/route.ts
- AllExceptionsFilter
- money.module.ts
- GamificationService
- noop.providers.ts
- DriverController
- NotificationsController
- compilerOptions
- scripts
- CurrentUser
- Common Diagnosis Patterns
- CarpoolsController
- .subscribe
- Library Docs
- AuthController
- pricing.service.ts
- DriverOnboardingService
- PlacesController
- 0003. Carpool discounted ride share fares
- tasks
- API Inventory
- admin.service.ts
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
- RequestRideDto
- Web (Marketing Site) Context
- Kari Backend — Architecture
- Design Tokens
- Project Overview
- 0002. Shuttle ops route assignment
- expo
- driver.controller.ts
- compilerOptions
- compilerOptions
- scripts
- GamificationController
- SubscriptionsService
- Provider Docs
- Graphify before/after study — running log
- rider.controller.ts
- include
- include
- configuration.ts
- RiderProfileDto
- RiderService
- Architecture
- By group (entity → its FK columns → target)
- CreateCarpoolDto
- VehicleDto
- driver/package.json
- rider/package.json
- .webhook
- ShuttleService
- RealtimeGateway
- SafetyService
- Build Graph
- deploy
- RateRideDto
- rider/context/README.md
- admins/page.tsx
- CreateDedicatedDriverDto
- SavedAddressDto
- permissions.guard.ts
- exclude
- WalletService
- devDependencies
- DriverQuizDto
- DriverDetailsDto
- TipRideDto
- ForgotPasswordDto
- permissions
- ios
- Driver App Context
- rider/app/(tabs)/_layout.tsx
- live/page.tsx
- Public
- LoginDto
- RiderLivenessDto
- Injectable
- InjectDataSource
- Technical Grounding (the trailer)
- InjectRepository
- devDependencies
- Kari — Agent context
- nest-cli.json
- SignUpDto
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
- otp.service.ts
- rider/src/stores/ride.store.ts
- admin/next.config.ts
- admin/postcss.config.mjs
- admin/tailwind.config.ts
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
- ProvidersModule
- google-auth-library
- expo-status-bar
- expo-auth-session

## God Nodes (most connected - your core abstractions)
1. `ResponseMessage()` - 138 edges
2. `CurrentUser` - 94 edges
3. `BaseEntity` - 62 edges
4. `colors` - 56 edges
5. `errorMessage()` - 45 edges
6. `Roles()` - 41 edges
7. `Column` - 39 edges
8. `KariButton()` - 38 edges
9. `Screen()` - 38 edges
10. `AppConfig` - 32 edges

## Surprising Connections (you probably didn't know these)
- `AuditLog` --references--> `Column`  [EXTRACTED]
  backend/src/admin/audit/entities/audit-log.entity.ts → admin/components/ui/data-table.tsx
- `Carpool` --references--> `Column`  [EXTRACTED]
  backend/src/carpools/entities/carpool.entity.ts → admin/components/ui/data-table.tsx
- `CarpoolMember` --references--> `Column`  [EXTRACTED]
  backend/src/carpools/entities/carpool-member.entity.ts → admin/components/ui/data-table.tsx
- `DriverProfile` --references--> `Column`  [EXTRACTED]
  backend/src/driver/entities/driver-profile.entity.ts → admin/components/ui/data-table.tsx
- `Vehicle` --references--> `Column`  [EXTRACTED]
  backend/src/driver/entities/vehicle.entity.ts → admin/components/ui/data-table.tsx

## Import Cycles
- None detected.

## Communities (271 total, 83 thin omitted)

### Community 0 - "RidesService"
Cohesion: 0.22
Nodes (3): OPEN_STATUSES, RidesService, Injectable

### Community 1 - "errorMessage"
Cohesion: 0.07
Nodes (48): InputField(), KariButton(), OptionRow(), expo-web-browser, ForgotPassword(), Otp(), extra, SignIn() (+40 more)

### Community 2 - "RiderProfile"
Cohesion: 0.31
Nodes (7): RiderProfile, Entity, SavedAddress, Entity, InjectRepository, ManyToOne, OneToMany

### Community 3 - "rider/src/api/endpoints.ts"
Cohesion: 0.06
Nodes (54): Addresses(), iconFor(), LABELS, titleCase(), ICON, naira(), RideHistory(), naira() (+46 more)

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

### Community 8 - "app.module.ts"
Cohesion: 0.07
Nodes (37): AppModule, Module, AuthModule, Module, JwtStrategy, Inject, Injectable, GoogleAuthService (+29 more)

### Community 9 - "icons.tsx"
Cohesion: 0.08
Nodes (30): NAV, NavGroup, NavItem, Route(), ArrowRight(), ArrowRightUp(), Bus(), CalendarMark() (+22 more)

### Community 10 - "Roles"
Cohesion: 0.11
Nodes (20): AdminCancelRideDto, ApiPropertyOptional, IsOptional, IsString, MaxLength, ApiProperty, IsEnum, UpdateAdminRoleDto (+12 more)

### Community 11 - "DriverService"
Cohesion: 0.18
Nodes (11): DriverService, Injectable, InjectRepository, DriverProfile, Entity, OneToOne, Entity, OneToOne (+3 more)

### Community 12 - "CarpoolsService"
Cohesion: 0.17
Nodes (7): CarpoolsService, haversineKm(), JOINABLE, occupancyMultiplier(), Injectable, InjectDataSource, InjectRepository

### Community 13 - "Kari Admin Console — ARCHITECTURE.md"
Cohesion: 0.05
Nodes (36): Audit logging, Information architecture (collapsible sidebar), Kari Admin Console — ARCHITECTURE.md, Local dev, Locked decisions (2026-06), Module specs (functionality × backend reality), Permission model (`@kari/types/rbac.ts`) — the contract, Phased plan (+28 more)

### Community 14 - "driver/src/api/endpoints.ts"
Cohesion: 0.06
Nodes (43): EarningsScreen(), naira(), PRESETS, TXN_META, TxnRow(), ICON, day(), time() (+35 more)

### Community 15 - "ResponseMessage"
Cohesion: 0.20
Nodes (17): AdminController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+9 more)

### Community 16 - "auth.service.ts"
Cohesion: 0.12
Nodes (16): RefreshDto, ApiProperty, IsString, ResetPasswordDto, ApiProperty, IsString, Matches, MinLength (+8 more)

### Community 17 - "BaseEntity"
Cohesion: 0.10
Nodes (25): CarpoolMember, Entity, BaseEntity, Document, Entity, IdentityModule, Module, ShuttleBooking (+17 more)

### Community 18 - "Column"
Cohesion: 0.12
Nodes (22): Column, CommsModule, Module, Inject, InjectRepository, ChatMessage, Entity, RealtimeService (+14 more)

### Community 19 - "devDependencies"
Cohesion: 0.05
Nodes (37): devDependencies, eslint, eslint-config-prettier, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, pino-pretty (+29 more)

### Community 20 - "mobile-core/src/index.ts"
Cohesion: 0.06
Nodes (38): Otp(), SignIn(), SignUp(), VerifyMethod(), SLIDES, { width }, RootLayout(), CATEGORIES (+30 more)

### Community 21 - "SetShuttleAssignmentDto"
Cohesion: 0.22
Nodes (8): SetShuttleAssignmentDto, ApiProperty, ApiPropertyOptional, IsOptional, IsString, IsUUID, MaxLength, ValidateIf

### Community 22 - "UsersService"
Cohesion: 0.15
Nodes (8): toPublic(), GoogleAuthDto, ApiProperty, IsString, MinLength, Injectable, InjectRepository, UsersService

### Community 23 - "subscription-new.tsx"
Cohesion: 0.11
Nodes (24): Coords, NewSubscription(), TimeChips(), IconName, SubscriptionsScreen(), Home(), Promo, PROMOS (+16 more)

### Community 24 - "AuthService"
Cohesion: 0.18
Nodes (7): AuthService, Injectable, ApiProperty, Matches, VerifyOtpDto, OtpService, Injectable

### Community 25 - "Code Standards"
Cohesion: 0.06
Nodes (33): Admin (Next.js), Admin (Next.js), API Client, API Response Envelope, Auth, Auth & Security, Backend (.env), Backend (NestJS) (+25 more)

### Community 26 - "devDependencies"
Cohesion: 0.06
Nodes (33): dependencies, @kari/types, next, react, react-dom, devDependencies, autoprefixer, postcss (+25 more)

### Community 27 - "PaymentsService"
Cohesion: 0.24
Nodes (3): PaymentsService, toKobo(), Injectable

### Community 28 - "dependencies"
Cohesion: 0.06
Nodes (33): dependencies, bullmq, class-transformer, class-validator, dotenv, @nestjs/core, @nestjs/swagger, @nestjs/throttler (+25 more)

### Community 29 - "ride/[id].tsx"
Cohesion: 0.07
Nodes (32): Checkbox(), Book(), CAR, CLASS_META, formatTrip(), { height: SCREEN_H }, naira(), PAYMENTS (+24 more)

### Community 30 - "IdentityService"
Cohesion: 0.11
Nodes (14): ApiBody, ApiConsumes, IdentityController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get (+6 more)

### Community 31 - "AdminService"
Cohesion: 0.07
Nodes (12): AdminService, fullName(), startOfToday(), stripPin(), Injectable, CreateAdminDto, ApiProperty, IsEmail (+4 more)

### Community 32 - "rides.service.ts"
Cohesion: 0.10
Nodes (23): CarpoolsModule, Module, CARPOOL_MAX_SEATS, CARPOOL_OCCUPANCY_MULTIPLIERS, Carpool, Entity, VersionColumn, MoneyModule (+15 more)

### Community 33 - "User"
Cohesion: 0.09
Nodes (21): DeviceToken, Entity, Notification, Entity, NotificationsModule, Module, NotificationsProcessor, Inject (+13 more)

### Community 34 - "rider/app/chat/[rideId].tsx"
Cohesion: 0.12
Nodes (18): ChatScreen(), DRIVER_EVENTS, useDispatchChannel(), ApiError, apiFetch(), refreshTokens(), RequestOptions, ApiConfig (+10 more)

### Community 35 - ".book"
Cohesion: 0.10
Nodes (20): BookShuttleDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsUUID, Max, Min (+12 more)

### Community 36 - "ride.tsx"
Cohesion: 0.06
Nodes (40): ActiveCarpool(), CarpoolScreen(), naira(), OfferCard(), STATUS_META, TERMINAL, DriverRideScreen(), naira() (+32 more)

### Community 37 - "mobile-core/package.json"
Cohesion: 0.07
Nodes (28): @expo/vector-icons, dependencies, @kari/types, socket.io-client, devDependencies, typescript, expo-router, @kari/types (+20 more)

### Community 38 - "RidesController"
Cohesion: 0.12
Nodes (22): CancelRideDto, ApiPropertyOptional, IsOptional, IsString, CounterOfferDto, ApiProperty, IsInt, IsPositive (+14 more)

### Community 39 - "PaymentProvider"
Cohesion: 0.11
Nodes (10): ChargeInput, ChargeResult, ChargeStatus, PaymentProvider, TransferInput, TransferResult, NoopPaymentProvider, mapStatus() (+2 more)

### Community 40 - "rider/src/stores/auth.store.ts"
Cohesion: 0.09
Nodes (13): styles, RootLayout(), Account(), IconName, RowItem, queryClient, AuthTokens, env (+5 more)

### Community 41 - "admin-api.ts"
Cohesion: 0.09
Nodes (21): EMPTY, AdminDriverRow, AdminUserRow, AuditEntry, CreateDedicatedDriverBody, FareConfig, FinanceSummary, Fleet (+13 more)

### Community 42 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 43 - "colors"
Cohesion: 0.12
Nodes (18): Props, Props, Props, Props, formatLocal(), PhoneInput(), Props, toLocalDigits() (+10 more)

### Community 44 - "comms.controller.ts"
Cohesion: 0.12
Nodes (17): CommsController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+9 more)

### Community 45 - "ReferralsService"
Cohesion: 0.11
Nodes (15): ApplyReferralDto, ApiProperty, IsString, ReferralsController, ApiBearerAuth, ApiOperation, ApiTags, Body (+7 more)

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

### Community 52 - "AllExceptionsFilter"
Cohesion: 0.38
Nodes (4): AllExceptionsFilter, codeForStatus(), STATUS_CODE, Catch

### Community 53 - "money.module.ts"
Cohesion: 0.09
Nodes (23): Inject, InjectRepository, bigintNumber, LedgerEntry, Entity, Transaction, Entity, Entity (+15 more)

### Community 54 - "GamificationService"
Cohesion: 0.10
Nodes (16): DriverModule, Module, Achievement, Entity, DriverScore, Entity, GamificationModule, Module (+8 more)

### Community 55 - "noop.providers.ts"
Cohesion: 0.10
Nodes (19): DeliveryResult, EmailProvider, MaskedCallInput, MaskedCallResult, PushInput, PushProvider, PutObjectInput, SendEmailInput (+11 more)

### Community 56 - "DriverController"
Cohesion: 0.13
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

### Community 60 - "CurrentUser"
Cohesion: 0.15
Nodes (16): CurrentUser, ApiBearerAuth, ApiOperation, Get, UseGuards, RiderController, ApiBearerAuth, ApiOperation (+8 more)

### Community 61 - "Common Diagnosis Patterns"
Cohesion: 0.09
Nodes (21): Admin Auth Issues, Admin Data Pages (A2–A6), Backend API Testing (curl), Backend Not Starting, Before Debugging Anything, Common Diagnosis Patterns, Database Quick Queries, Debug Guide (+13 more)

### Community 62 - "CarpoolsController"
Cohesion: 0.24
Nodes (12): CarpoolsController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+4 more)

### Community 63 - ".subscribe"
Cohesion: 0.15
Nodes (13): SubscribeDto, ApiProperty, IsString, SubscriptionsController, ApiBearerAuth, ApiOperation, ApiTags, Body (+5 more)

### Community 64 - "Library Docs"
Cohesion: 0.10
Nodes (21): Authority Order, Backend — emit via `RealtimeService` (not the gateway directly), Backend (MapsProvider — full contract in provider-docs.md), BullMQ (Backend), Entity Definition, Expo Router v6 (Mobile), File-based Routing, Google Maps (Backend + Mobile) (+13 more)

### Community 65 - "AuthController"
Cohesion: 0.18
Nodes (9): AuthController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get, HttpCode (+1 more)

### Community 66 - "pricing.service.ts"
Cohesion: 0.08
Nodes (17): Inject, MAPS_PROVIDER, MapsProvider, QuoteDto, ApiProperty, ApiPropertyOptional, IsNumber, IsOptional (+9 more)

### Community 67 - "DriverOnboardingService"
Cohesion: 0.19
Nodes (3): DriverOnboardingService, scorePersonality(), Injectable

### Community 68 - "PlacesController"
Cohesion: 0.16
Nodes (12): PlacesController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get, Query, PlacesModule (+4 more)

### Community 69 - "0003. Carpool discounted ride share fares"
Cohesion: 0.13
Nodes (14): 0003. Carpool discounted ride share fares, Build plan, Consequences, Context, Decision, Feature design, Follow-up, Option 1: Occupancy multiplier table on the backend, server computed `projectedShare` for the UI (+6 more)

### Community 70 - "tasks"
Cohesion: 0.12
Nodes (19): ^build, coverage/**, dependsOn, outputs, cache, persistent, dist/**, dependsOn (+11 more)

### Community 71 - "API Inventory"
Cohesion: 0.11
Nodes (19): Admin — `/admin` (ADMIN + `PermissionsGuard`), API Inventory, Auth — `/auth` (all `@Public` except `/me`), Availability — `/availability` (DRIVER), Carpools — `/carpools`, Comms — under `/rides` · participants only, Drivers — `/drivers` (DRIVER), Engagement (+11 more)

### Community 72 - "admin.service.ts"
Cohesion: 0.09
Nodes (21): AdminModule, Module, ACTIVE_DRIVING, ACTIVE_RIDE_STATUSES, Page, AUDIT_ACTION, AuditInterceptor, REDACT (+13 more)

### Community 73 - "AvailabilityController"
Cohesion: 0.13
Nodes (14): AvailabilityController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, HttpCode, Post (+6 more)

### Community 74 - "tickets/page.tsx"
Cohesion: 0.15
Nodes (14): DedicatedDriversPage(), ShuttlePage(), FILTERS, STATUS_TONE, TicketsPage(), ACTIVE, naira(), STATUS_TONE (+6 more)

### Community 75 - "PasswordService"
Cohesion: 0.21
Nodes (5): PasswordService, scrypt, Injectable, TokenService, Injectable

### Community 76 - "contracts.ts"
Cohesion: 0.11
Nodes (19): Inject, InjectRepository, EMAIL_PROVIDER, IDENTITY_PROVIDER, IdentityProvider, LIVENESS_PROVIDER, LivenessProvider, LivenessResult (+11 more)

### Community 77 - "Entries"
Cohesion: 0.11
Nodes (19): chore · infra · Railway backend deploy + EAS build pipeline — 2026-06-08/09, docs · context · Context system rebuilt around foundation.md — 2026-07-30, docs · context · Cross-cutting + per-product context system — 2026-06-17, Entries, feature · admin · A2–A6: live fleet, actions+audit, dedicated drivers, tickets, financials — 2026-06-05, feature · admin · Admins & Roles page — 2026-06-23, feature · backend+driver · Carpool v2: driver carpool-mode toggle (spec 0001) — 2026-08-03, feature · backend · OTP on re-login (2FA) + longer-lived sessions — 2026-06-18 (+11 more)

### Community 78 - "Kari — Foundation"
Cohesion: 0.12
Nodes (17): §0 Build constraints, §10 Known scale seams, §11 The deepest risk, §12 Open questions, §1 What it is, §2 Who it's for, §3 Success & stage, §4 Guiding principles (+9 more)

### Community 79 - "Kari Driver App — Architecture & Design"
Cohesion: 0.12
Nodes (17): 10. Maps & Location (the defining driver concern), 11. Design System, 12. Screen Inventory (driver, union of legacy flows, on real data), 13. Cross-Cutting Concerns, 14. Requirements Traceability (driver-facing), 15. Decisions Log, 16. Build Plan (mirrors the backend & rider phases), 1. Purpose & Goals (+9 more)

### Community 80 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, expo, expo-camera, expo-font, @expo-google-fonts/geist-mono, expo-router, nativewind, react-native-otp-entry (+9 more)

### Community 81 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, expo, expo-camera, expo-font, expo-notifications, @kari/types, react-native-otp-entry, tailwindcss (+9 more)

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

### Community 86 - "RequestRideDto"
Cohesion: 0.14
Nodes (8): RequestRideDto, ApiProperty, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsPositive, IsString

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

### Community 93 - "driver.controller.ts"
Cohesion: 0.22
Nodes (8): DriverPersonalDto, ApiProperty, IsString, MinLength, LivenessCheckDto, ApiProperty, IsString, IsDateString

### Community 94 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, composite, declarationMap, lib, module, moduleResolution, outDir, rootDir (+6 more)

### Community 95 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, noFallthroughCasesInSwitch, noImplicitReturns (+6 more)

### Community 96 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, lint, migration:generate, migration:revert, migration:run, start (+5 more)

### Community 97 - "GamificationController"
Cohesion: 0.24
Nodes (7): GamificationController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get, UseGuards

### Community 98 - "SubscriptionsService"
Cohesion: 0.17
Nodes (11): Subscription, Entity, planById(), SUBSCRIPTION_PLANS, SubscriptionPlan, Get, SubscriptionsModule, Module (+3 more)

### Community 99 - "Provider Docs"
Cohesion: 0.15
Nodes (13): AWS Rekognition (Liveness), AWS S3 (Storage), AWS SES (Email) — planned, Dojah (Identity / NIN), Expo Push / FCM (Push) — planned, Google Maps (Maps), Paystack (Payments) — the only live provider, Provider Architecture (+5 more)

### Community 100 - "Graphify before/after study — running log"
Cohesion: 0.11
Nodes (17): Design outcome, Design outcome, Design outcome, Develop step — measured, Develop step — measured, Develop + verify — measured, Explore step (architect phase) — measured, Explore step (architect phase) — measured (+9 more)

### Community 101 - "rider.controller.ts"
Cohesion: 0.24
Nodes (7): RiderPreferencesDto, ApiPropertyOptional, IsBoolean, IsEnum, IsOptional, IsString, MaxLength

### Community 102 - "include"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, paths, strict, extends, include, expo-env.d.ts, expo/tsconfig.base (+4 more)

### Community 103 - "include"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, paths, strict, extends, include, expo-env.d.ts, expo/tsconfig.base (+4 more)

### Community 104 - "configuration.ts"
Cohesion: 0.23
Nodes (6): loadConfiguration(), Env, envSchema, AppDataSource, config, main()

### Community 105 - "RiderProfileDto"
Cohesion: 0.25
Nodes (8): RiderProfileDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, IsString, MaxLength, MinLength

### Community 107 - "Architecture"
Cohesion: 0.10
Nodes (20): Admin -> Backend, Admin & Identity, Architecture, Authentication, Data Flow Patterns, Database Entity Groups, Engagement, Invariants (+12 more)

### Community 108 - "By group (entity → its FK columns → target)"
Cohesion: 0.18
Nodes (11): Admin & Identity, By group (entity → its FK columns → target), Engagement, Entity Relationships, How relations are modeled (important), Money, Ride variants, Rides (+3 more)

### Community 109 - "CreateCarpoolDto"
Cohesion: 0.18
Nodes (10): CreateCarpoolDto, ApiProperty, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsString, Max (+2 more)

### Community 110 - "VehicleDto"
Cohesion: 0.20
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

### Community 116 - "SafetyService"
Cohesion: 0.05
Nodes (35): EmergencyContactDto, ApiProperty, ApiPropertyOptional, IsOptional, IsString, Matches, MaxLength, PanicDto (+27 more)

### Community 117 - "Build Graph"
Cohesion: 0.20
Nodes (10): Build Graph, Capabilities & dependency edges, Explicitly out of scope, Layer 0 — foundational prerequisites (all ✅), Real provider implementations (foundation §7 #15 — each independent, slot-in), Ride-variant v2 (the vision gaps — foundation §8 In-scope; contracts in architecture.md → Ride Type Matrix), Standalone (buildable from a cold start, no prerequisites), The keystone unlock (+2 more)

### Community 118 - "deploy"
Cohesion: 0.20
Nodes (9): build, builder, dockerfilePath, deploy, healthcheckPath, healthcheckTimeout, restartPolicyMaxRetries, restartPolicyType (+1 more)

### Community 119 - "RateRideDto"
Cohesion: 0.22
Nodes (8): RateRideDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsString, Max, Min

### Community 120 - "rider/context/README.md"
Cohesion: 0.27
Nodes (5): App-specific components — `src/components/` (local), Design tokens (summary — full rules in context/design-tokens.md), Layout conventions, Shared primitives — re-exported from `@kari/mobile-core`, UI Registry

### Community 121 - "admins/page.tsx"
Cohesion: 0.25
Nodes (8): AdminsPage(), EMPTY, genPassword(), Input(), ROLES, Select(), AdminAccount, CreateAdminBody

### Community 122 - "CreateDedicatedDriverDto"
Cohesion: 0.22
Nodes (9): CreateDedicatedDriverDto, ApiProperty, ApiPropertyOptional, IsEmail, IsEnum, IsOptional, IsString, Matches (+1 more)

### Community 123 - "SavedAddressDto"
Cohesion: 0.25
Nodes (8): SavedAddressDto, ApiProperty, IsEnum, IsNumber, IsString, Max, Min, MinLength

### Community 124 - "permissions.guard.ts"
Cohesion: 0.33
Nodes (3): PERMISSIONS_KEY, PermissionsGuard, Injectable

### Community 125 - "exclude"
Cohesion: 0.22
Nodes (8): exclude, extends, dist, node_modules, test, **/*.e2e-spec.ts, **/*.spec.ts, ./tsconfig.json

### Community 126 - "WalletService"
Cohesion: 0.33
Nodes (3): toNaira(), Injectable, WalletService

### Community 127 - "devDependencies"
Cohesion: 0.22
Nodes (9): @expo/ngrok, devDependencies, @babel/core, @expo/ngrok, @types/react, typescript, @babel/core, @types/react (+1 more)

### Community 128 - "DriverQuizDto"
Cohesion: 0.25
Nodes (7): ArrayNotEmpty, DriverQuizDto, ApiProperty, IsInt, Max, Min, IsArray

### Community 129 - "DriverDetailsDto"
Cohesion: 0.22
Nodes (8): DriverDetailsDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString, Matches, MinLength

### Community 130 - "TipRideDto"
Cohesion: 0.25
Nodes (7): TipRideDto, ApiProperty, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsPositive

### Community 132 - "ForgotPasswordDto"
Cohesion: 0.33
Nodes (6): ForgotPasswordDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, Matches

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
Cohesion: 0.43
Nodes (4): TabsLayout(), DotTabBar(), TABS, registerForPush()

### Community 137 - "live/page.tsx"
Cohesion: 0.33
Nodes (6): AVAIL_TONE, BOUNDS, clamp01(), LiveRidesPage(), Row, FleetDriver

### Community 138 - "Public"
Cohesion: 0.11
Nodes (13): AppController, ApiTags, Controller, Get, IS_PUBLIC_KEY, Public(), JwtAuthGuard, Injectable (+5 more)

### Community 139 - "LoginDto"
Cohesion: 0.29
Nodes (7): LoginDto, ApiProperty, ApiPropertyOptional, IsEnum, IsOptional, IsString, MinLength

### Community 140 - "RiderLivenessDto"
Cohesion: 0.40
Nodes (4): RiderLivenessDto, ApiProperty, IsString, MinLength

### Community 143 - "Technical Grounding (the trailer)"
Cohesion: 0.29
Nodes (7): Build status at a glance, Current priorities, Key domain concepts (the vocabulary), Out of scope (current phase), Products, Roadmap (post-MVP), Technical Grounding (the trailer)

### Community 146 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/core, @types/react, typescript, @babel/core, @types/react, typescript

### Community 149 - "Kari — Agent context"
Cohesion: 0.33
Nodes (5): Agent skills, Authority, Context files (read before you build), Kari — Agent context, Standing instructions

### Community 150 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 152 - "SignUpDto"
Cohesion: 0.22
Nodes (9): SignUpDto, ApiProperty, ApiPropertyOptional, IsEmail, IsEnum, IsOptional, IsString, Matches (+1 more)

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

### Community 180 - "otp.service.ts"
Cohesion: 0.18
Nodes (8): OtpSendResult, Inject, SMS_PROVIDER, SmsProvider, WHATSAPP_PROVIDER, WhatsAppProvider, NoopWhatsAppProvider, REDIS_CLIENT

### Community 278 - "ProvidersModule"
Cohesion: 0.67
Nodes (3): ProvidersModule, Global, Module

## Knowledge Gaps
- **1073 isolated node(s):** `CARPOOL_MAX_SEATS`, `CARPOOL_OCCUPANCY_MULTIPLIERS`, `Standing instruction for the AI agent`, `feature · backend+rider · Carpool v2: discounted ride-share fares (spec 0003) — 2026-08-03`, `feature · types+backend+admin · Shuttle v2: ops route assignment (spec 0002) — 2026-08-03` (+1068 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Index()` connect `Column` to `rides.service.ts`, `User`, `RiderProfile`, `SubscriptionsService`, `CreateTicketDto`, `admin.service.ts`, `DriverService`, `BaseEntity`, `mobile-core/src/index.ts`, `money.module.ts`, `GamificationService`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `colors` connect `colors` to `errorMessage`, `rider/app/chat/[rideId].tsx`, `rider/src/api/endpoints.ts`, `ride.tsx`, `rider/src/stores/auth.store.ts`, `rider/app/(tabs)/_layout.tsx`, `driver/src/api/endpoints.ts`, `mobile-core/src/index.ts`, `subscription-new.tsx`, `ride/[id].tsx`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `Column` connect `Column` to `rides.service.ts`, `User`, `RiderProfile`, `SubscriptionsService`, `CreateTicketDto`, `admin.service.ts`, `live/page.tsx`, `admin-api.ts`, `tickets/page.tsx`, `DriverService`, `cn`, `shuttle/page.tsx`, `BaseEntity`, `money.module.ts`, `GamificationService`, `admins/page.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `CARPOOL_MAX_SEATS`, `CARPOOL_OCCUPANCY_MULTIPLIERS`, `Standing instruction for the AI agent` to the rest of the system?**
  _1073 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `errorMessage` be split into smaller, more focused modules?**
  _Cohesion score 0.07277701778385773 - nodes in this community are weakly interconnected._
- **Should `rider/src/api/endpoints.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057859703020993344 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._