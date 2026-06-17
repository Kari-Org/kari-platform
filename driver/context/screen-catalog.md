# Screen Catalog

Every route in `driver/app/`. **Uses** = the API groups / stores / hooks each screen imports.

## Root
| Route | Purpose | Uses |
|---|---|---|
| `index.tsx` | Splash + **3-way hard gate** (auth → onboarding(KYC) → tabs) | driversApi, useAuthStore |
| `_layout.tsx` | Shell: fonts, providers, `unauthenticated → welcome` | useAuthStore |
| `success.tsx` | Post-step success states | — |

## `(auth)/` — same flow as rider (no forgot-password screen)
| Route | Uses |
|---|---|
| `welcome.tsx` | — |
| `signup.tsx` | (signup draft) |
| `verify-method.tsx` | authApi |
| `otp.tsx` | authApi, useAuthStore |
| `signin.tsx` | authApi, useAuthStore |

## `(onboarding)/` — the KYC wizard (hard gate)
| Route | Purpose | Uses |
|---|---|---|
| `index.tsx` | Single-screen **6-step KYC**: personal · quiz · vehicle · details (payout + NOK) · NIN · liveness → complete | driversApi, useAuthStore |

## `(tabs)/` — home · trips · account (Expo Tabs + Ionicons; **dispatch mounted here**)
| Route | Purpose | Uses |
|---|---|---|
| `home.tsx` | **Online toggle + map + location streaming + today's earnings** — the driver's main screen | availabilityApi, driversApi, ridesApi, walletApi, useAvailabilityStore, useRideStore, startTracking/stopTracking |
| `trips.tsx` | Trip history | ridesApi |
| `account.tsx` | Profile, vehicle, logout | authApi, driversApi, useAuthStore |

## Flow & feature screens
| Route | Purpose | Uses |
|---|---|---|
| `ride.tsx` | **Active ride**: navigate → arrived → **enter rider PIN** (start) → complete → rate; chat, panic | ridesApi, commsApi, safetyApi, useAvailabilityStore, useRideStore |
| `carpool.tsx` | Carpool offers (socket-discovered); accept / complete | carpoolsApi, useCarpoolStore |
| `earnings.tsx` | Earnings dashboard + payout | paymentsApi, walletApi |
| `rewards.tsx` | Leaderboard, achievements, referrals | gamificationApi, driversApi, referralsApi |
| `safety.tsx` | Emergency contacts; panic | safetyApi |
| `chat/[rideId].tsx` | In-ride chat | commsApi, authApi |
| `notifications.tsx` | Notifications | notificationsApi |
| `shuttle.tsx` | Assigned shuttle routes/trips (driver view) | shuttleApi |
| `support.tsx` | Support tickets | ticketsApi |

> **Dispatch is not a screen** — `IncomingRequest` is an overlay rendered by `(tabs)/_layout` over any tab
> when `incomingOffer` is set (README → Dispatch). The active ride is a single screen, `ride.tsx`.

> **P3–P6 screens** (earnings, rewards, carpool, shuttle, safety, chat, notifications, support) are committed
> but **not yet device-verified**; background location needs an EAS dev build — see context/progress-tracker.md.
