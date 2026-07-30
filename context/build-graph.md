# Build Graph

> **What this file governs:** what depends on what — the dependency map of Kari's remaining work.
> For *why* any decision was made see [foundation.md](foundation.md) (it wins on conflict); for what's
> already shipped see [progress-log.md](progress-log.md).
>
> **How to read this file.** This is a **map, not a timeline** — nothing here prescribes an order beyond
> the arrows. **Hard requirement** = cannot build without. **Soft benefit** = easier/safer with. Pick any
> buildable node; the graph only says what must exist first.
>
> Status key: ✅ done · ⬜ buildable · 🟡 in progress · 🕗 blocked on a decision (see foundation §12)

---

## Layer 0 — foundational prerequisites (all ✅)

The platform's base is **built and deployed**: monorepo + `@kari/types` contract, unified NestJS backend
(P0–P6), rider & driver apps (P0–P6, rider visually redesigned to Figma), admin console (A0–A6 incl.
Admins & Roles), marketing web, Railway deploy, EAS build pipeline. Nothing below waits on scaffolding.

## The keystone unlock

The original keystone — the unified backend + shared types (foundation §9) — is ✅ built. The **remaining
keystone is ⬜ runtime verification** of mobile P3–P6 and admin A2–A6: it's prerequisite-free, and almost
everything else is safer after it (hardening what's unverified means hardening blind; building carpool v2
on an unverified carpool v1 compounds risk). Soft-blocks most of the graph; hard-blocks nothing.

---

## Capabilities & dependency edges

### Verification & hardening
| Node | Status | Needs (hard) | Benefits from (soft) |
|------|--------|--------------|----------------------|
| Runtime-verify rider P3–P6 | ⬜ | running backend (✅) | — |
| Runtime-verify driver P3–P6 | ⬜ | running backend (✅) | — |
| Runtime-verify admin A2–A6 + Admins & Roles | ⬜ | running backend (✅) | — |
| P7 hardening — backend (perf, error states, scrypt cost bump N≥2¹⁷) | ⬜ | — | verification pass |
| P7 hardening — mobile (a11y, offline, empty/error states, perf) | ⬜ | — | verification pass |
| Maestro e2e suites (rider + driver) | ⬜ | — | P7 mobile polish (stable selectors) |
| EAS store builds (App Store / Play submission) | ⬜ | P7 mobile · push decision 🕗 | e2e suites |

### Real provider implementations (foundation §7 #15 — each independent, slot-in)
| Node | Status | Needs (hard) | Notes |
|------|--------|--------------|-------|
| Termii SMS (OTP) | ⬜ | Termii account/keys ⏳ | unlocks real onboarding in the field |
| Twilio WhatsApp (OTP) | ⬜ | Twilio account ⏳ | pairs with Termii for channel choice |
| Dojah NIN verification | ⬜ | Dojah keys ⏳ | unlocks real KYC + carpool gate |
| AWS Rekognition liveness | ⬜ | AWS account ⏳ | pairs with Dojah for full KYC |
| AWS S3 storage | ⬜ | AWS account ⏳ | real document uploads |
| Google Maps (real impl) | ⬜ | API key (present in env schema) | real pricing/autocomplete accuracy |
| Twilio Voice (masked calls) | ⬜ | Twilio account ⏳ | — |
| Push (Expo Push vs FCM) | 🕗 | **decision** (foundation §12) | hard-blocks store-launch notifications |
| Email (SES, transactional) | 🕗 | **provider confirm** (foundation §12) | lowest urgency — noop acceptable at launch |

### Ride-variant v2 (the vision gaps — foundation §8 In-scope; contracts in architecture.md → Ride Type Matrix)
| Node | Status | Needs (hard) | Benefits from (soft) |
|------|--------|--------------|----------------------|
| Carpool v2 — driver carpool-mode toggle | ⬜ | — | carpool v1 verified |
| Carpool v2 — per-rider PIN + incremental en-route dispatch | ⬜ | carpool-mode toggle | — |
| Carpool v2 — discounted ride-share fares (replace equal split) | ⬜ | — | — |
| Carpool v2 — pickup/dropoff route optimization | ⬜ | incremental dispatch | — |
| Shuttle v2 — QR board/alight (charge by stop distance) | ⬜ | — | shuttle v1 verified |
| Shuttle v2 — ops assigns driver→bus→route in admin | ⬜ | — | — |
| Shuttle v2 — route search/filter by route + timing | ⬜ | — | — |
| Subscription v2 — scheduled dispatch job | ⬜ | new BullMQ queue registration | — |
| Subscription v2 — fallback chain (sticky → dedicated → freelance) | ⬜ | scheduler job | — |
| Subscription v2 — per-route pricing + free-at-use + frequency/two-way config | ⬜ | — | scheduler job |

### Standalone (buildable from a cold start, no prerequisites)
- Any single **runtime-verification** pass (highest leverage — see keystone)
- **scrypt cost-parameter bump** (one service, one constant)
- **Carpool discounted-fare model** (pricing change, self-contained)
- **Shuttle ops-assignment admin page** (admin + backend, independent of QR)
- **Google Maps real provider** (key already provisioned for in env)
- **Web** product-page expansion, if marketing needs it (static, isolated)

---

## The one genuine tension

**Verify-first vs build-forward.** The founder is solo and part-time (foundation §0); every session spent
runtime-verifying P3–P6 is a session not building the v2 variants that differentiate Kari (§11). The graph
can't resolve this — it only says: v2 work built on unverified v1 foundations carries compounding risk,
while verification produces no user-visible progress. The honest default: verify the slice you're about to
extend, not everything at once (e.g. verify carpool v1 → build carpool v2; verify wallet → ship real
providers that touch money).

## Explicitly out of scope

See foundation §8 (Out + Deferred) — nothing in those lists appears in this graph.
