# Screen Catalog

Every route in `rider/app/` (Expo Router, file-based). **Uses** = the API groups / stores / hooks each
screen depends on (extracted from imports).

## Root
| Route | Purpose | Uses |
|---|---|---|
| `index.tsx` | Animated splash; self-routes to home/welcome by auth status | useAuthStore |
| `_layout.tsx` | App shell: fonts, providers, 2-way auth gate | useAuthStore |
| `success.tsx` | Post-auth success; routes new users → `(onboarding)/profile`, else home | — |

## `(auth)/` — phone-first auth
| Route | Purpose | Uses |
|---|---|---|
| `welcome.tsx` | Entry / onboarding carousel | BrandMark |
| `signup.tsx` | Collect email/phone/password into the transient draft | useSignupDraft, BrandMark |
| `verify-method.tsx` | Choose SMS vs WhatsApp; fires signup + OTP send | authApi, useSignupDraft |
| `otp.tsx` | Enter OTP → `authApi.verify` → set session | authApi, useAuthStore |
| `signin.tsx` | Login (identifier + password) → set session | authApi, useAuthStore |
| `forgot-password.tsx` | Request + complete password reset | authApi |

## `(onboarding)/` — linear: profile → liveness → preferences
| Route | Purpose | Uses |
|---|---|---|
| `profile.tsx` | Name + details → `POST /riders/onboarding/profile`; → liveness | ridersApi |
| `liveness.tsx` | Selfie liveness → `POST /riders/liveness`; → preferences | ridersApi |
| `preferences.tsx` | Driver-behavior / music / accessibility + home address | ridersApi, AddressAutocomplete |

## `(tabs)/` — home · rides · account (custom `DotTabBar`)
| Route | Purpose | Uses |
|---|---|---|
| `home.tsx` | Dashboard; current location (reverse geocode), greeting | placesApi, ridersApi |
| `rides.tsx` | Booking entry — pickup/dropoff with autocomplete | ridesApi, placesApi, ridersApi, useLocationStore, AddressAutocomplete |
| `account.tsx` | Profile, settings, logout | authApi, ridersApi, useAuthStore |

## Flow & feature screens (pushed on the stack)
| Route | Purpose | Uses |
|---|---|---|
| `book.tsx` | Quote → class/pricing/payment → request (solo + carpool create) | ridesApi, carpoolsApi, ridersApi, walletApi, useLocationStore |
| `ride/[id].tsx` | **Active ride** — live tracking, chat, share-trip, panic, rate | ridesApi, commsApi, safetyApi, useLocationStore, **useRideChannel** |
| `ride-history.tsx` | Completed / cancelled rides | ridesApi |
| `carpools.tsx` | Joinable carpools near me | carpoolsApi, ridersApi, useLocationStore |
| `carpool/[id].tsx` | Carpool detail; join / leave | carpoolsApi, authApi |
| `shuttle.tsx` | Browse routes/trips; book a seat | shuttleApi |
| `subscriptions.tsx` | Plans; subscribe / manage | subscriptionsApi |
| `wallet.tsx` | Balance, top-up (Paystack), transactions | walletApi |
| `rewards.tsx` | Leaderboard + referrals | gamificationApi, referralsApi |
| `safety.tsx` | Emergency contacts; panic | safetyApi, useLocationStore |
| `chat/[rideId].tsx` | In-ride chat thread | commsApi, authApi |
| `notifications.tsx` | Notification list; mark read | notificationsApi |
| `support.tsx` | Submit / view support tickets | ticketsApi |
| `verify-nin.tsx` | Submit NIN (carpool gate) | ridersApi |

> **P3–P6 screens** (wallet, rewards, subscriptions, carpools, shuttle, safety, chat, notifications,
> support, verify-nin) are committed but **not yet device-verified** — see context/progress-tracker.md.
> The current carpool/shuttle/subscription screens reflect the **as-built** behavior, which diverges from
> the target Ride Flows (context/project-overview.md → Ride Flows).
