# API Inventory

Every HTTP route, extracted from `*.controller.ts`. **Auth model:** every route requires a valid JWT
**unless marked `@Public`** (global `JwtAuthGuard`). Role/permission columns show per-controller
`@Roles(...)` / `@RequirePermissions(...)`. All responses are wrapped in the `ApiResponse<T>` envelope.

> Several controllers mount on shared bases: `comms` and `safety/trip-share` add routes under `/rides`;
> `safety/trip-share` also owns `/trips`; `gamification` mounts `/leaderboard` + `/gamification/*` at root.

---

## Auth — `/auth` (all `@Public` except `/me`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/signup` | Create account (role + channel), triggers OTP |
| POST | `/auth/send-otp` | (Re)send OTP via SMS/WhatsApp |
| POST | `/auth/verify` | Verify OTP → activate |
| POST | `/auth/login` | Phone + password → tokens |
| POST | `/auth/google` | Google ID-token sign-in (dev fallback) |
| POST | `/auth/refresh` | Rotate refresh → new access |
| POST | `/auth/forgot-password` | Start reset |
| POST | `/auth/reset-password` | Complete reset |
| GET | `/auth/me` | Current user (authed) |

## Riders — `/riders` (RIDER)
| Method | Path | Purpose |
|---|---|---|
| GET | `/riders/me` | Rider profile |
| POST | `/riders/onboarding/profile` | Name/details |
| POST | `/riders/onboarding/preferences` | Preferences survey (behavior/music/accessibility) |
| POST | `/riders/addresses` · GET `/riders/addresses` | Saved addresses (home/work) |
| POST | `/riders/nin` | Submit NIN |
| POST | `/riders/liveness` | One-shot selfie liveness |

## Drivers — `/drivers` (DRIVER)
| Method | Path | Purpose |
|---|---|---|
| GET | `/drivers/me` | Driver profile + onboarding state |
| POST | `/drivers/onboarding/personal` · `/quiz` · `/vehicle` · `/details` · `/nin` | KYC wizard steps |
| POST | `/drivers/onboarding/liveness/session` · `/liveness/check` | Liveness session + result |
| POST | `/drivers/onboarding/complete` | Gated finish (all steps required) |

## Identity — `/identity`
| Method | Path | Purpose |
|---|---|---|
| POST | `/identity/documents/:type` | Upload a document (→ S3 provider) |
| GET | `/identity/documents` | List own documents |

## Availability — `/availability` (DRIVER)
| Method | Path | Purpose |
|---|---|---|
| POST | `/availability/online` `{lat,lng}` | Go online (Redis GEO) |
| POST | `/availability/location` `{lat,lng}` | Stream position |
| POST | `/availability/offline` | Go offline |

## Rides — `/rides`
| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/rides/quote` | RIDER | Price a trip (cached quote) |
| POST | `/rides` | RIDER | Request a ride (409 if one active) |
| GET | `/rides/mine` · `/rides/:id` | any | List / view (enriched w/ counterparty) |
| POST | `/rides/:id/accept` | DRIVER | Accept (standard); mints start PIN |
| POST | `/rides/:id/offer` | DRIVER | Counter-offer (negotiate) |
| POST | `/rides/:id/offers/:offerId/accept` | RIDER | Accept a counter; mints start PIN |
| POST | `/rides/:id/arrived` · `/start` `{otp}` · `/complete` | DRIVER | Arrival → PIN start → settle |
| POST | `/rides/:id/cancel` · `/rate` | any | Cancel (penalty rules) / rate |

## Comms — under `/rides` · participants only
| Method | Path | Purpose |
|---|---|---|
| POST | `/rides/:id/messages` · GET `/rides/:id/messages` | In-ride chat (persisted + socket) |
| POST | `/rides/:id/call` | Start masked call |

## Safety — `/safety` + share routes
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST/GET/DELETE | `/safety/contacts[/:id]` | authed | Emergency contacts CRUD |
| POST | `/safety/panic` · `/safety/panic/:id/resolve` | authed | Trigger / resolve panic (SOS + `'ops'` socket) |
| POST | `/rides/:id/share` · `/rides/:id/share/stop` | authed | Start / revoke a share link |
| GET | `/trips/shared/:token` | **Public** | Read-only trip status (no PIN, no PII) |

## Carpools — `/carpools`
| Method | Path | Role | Purpose |
|---|---|---|---|
| POST `/carpools` · GET `/carpools` | | RIDER | Create / list open carpools |
| GET | `/carpools/mine` · `/carpools/:id` | any | Mine / detail |
| POST | `/carpools/:id/join` · `/leave` · `/cancel` | RIDER | Membership (NIN-gated, re-splits fare) |
| POST | `/carpools/:id/accept` · `/complete` | DRIVER | Driver accept / settle |

## Shuttle — `/shuttle`
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/shuttle/routes` · `/shuttle/trips` | any | Browse routes / trips |
| GET | `/shuttle/bookings/mine` | RIDER | My bookings |
| POST | `/shuttle/trips/:id/book` · `/shuttle/bookings/:id/cancel` | RIDER | Book (wallet) / cancel (refund) |

## Subscriptions — `/subscriptions`
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/subscriptions/plans` | any | Static plan catalog |
| POST `/subscriptions` · GET `/subscriptions/mine` · POST `/subscriptions/:id/cancel` | | RIDER | Subscribe / mine / cancel |

## Money
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/wallet` · `/wallet/transactions` | authed | Balance / ledger |
| POST | `/wallet/topup` · `/wallet/topup/:reference/verify` | authed | Top-up (Paystack) + verify |
| POST | `/wallet/payout` | DRIVER | Request payout |
| GET | `/payments/earnings` | DRIVER | Earnings summary |
| POST | `/payments/webhook` | **Public** | Paystack webhook (HMAC-verified, raw body) |

## Engagement
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/leaderboard` | any | Weekly leaderboard |
| GET | `/gamification/me` · `/gamification/achievements` | DRIVER | Score / badges |
| GET | `/referrals/me` · POST `/referrals/apply` | authed | Referral code / apply |

## Notifications — `/notifications`
| Method | Path | Purpose |
|---|---|---|
| POST | `/notifications/devices` | Register push device token |
| GET | `/notifications` · POST `/notifications/:id/read` | List / mark read |

## Places — `/places`
| Method | Path | Purpose |
|---|---|---|
| GET | `/places/autocomplete` · `/places/reverse` | Proxied autocomplete / reverse geocode |

## Tickets — `/tickets`
| Method | Path | Purpose |
|---|---|---|
| POST | `/tickets` · GET `/tickets/mine` | Submit / list support tickets |

## Admin — `/admin` (ADMIN + `PermissionsGuard`)
Each route declares `@RequirePermissions(...)`.
| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/admin/stats` | `dashboard:view` | KPI aggregates |
| GET | `/admin/users` · `/admin/users/:id` | `riders:read` | User tables / detail |
| PATCH | `/admin/users/:id/status` | `riders:manage` | Suspend/reactivate |
| GET | `/admin/drivers` | `drivers:read` | Driver roster (filterable) |
| POST | `/admin/drivers/:id/verify` | `drivers:verify` | Approve KYC |
| POST | `/admin/drivers/dedicated` | `dedicated:onboard` | Onboard dedicated driver |
| GET | `/admin/rides` | `trips:read` | Trips history |
| POST | `/admin/rides/:id/cancel` | `trips:override` | Override-cancel |
| GET | `/admin/fleet` | `fleet:view` | Live fleet (Redis GEO + active) |
| GET | `/admin/finance/summary` · `/admin/finance/payouts` · `/admin/fare-config` | `finance:read` | Financials |
| GET | `/admin/tickets` · PATCH `/admin/tickets/:id` | `tickets:read` / `tickets:manage` | Ticket inbox |
| GET | `/admin/audit` | `audit:read` | Audit log |

## Root — `@Public`
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` · `/` | Health / liveness |

> Swagger UI for all of the above is served at **`/docs`**.
