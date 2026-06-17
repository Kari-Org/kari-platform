# Provider Docs

Project-specific patterns for every external service provider in KariPlatform. Every provider is behind an
interface — modules never import vendor SDKs directly.

> **Signatures here mirror `backend/src/providers/contracts.ts` (the source of truth).** There are **10
> providers**. If a signature ever disagrees with `contracts.ts`, the code wins.

---

## Provider Architecture

All contracts live in `backend/src/providers/contracts.ts`; impls + noops in the same folder; wiring in
`providers.module.ts`. Each capability has:
- An **interface** (the contract) + a **DI token** (`PAYMENT_PROVIDER`, `EMAIL_PROVIDER`, …).
- A **noop implementation** (dev/test — auto-succeeds, no keys needed).
- A **real implementation** *where built*.

> ⚠️ **Reality check:** today **only `PaymentProvider` has a real impl** (`PaystackPaymentProvider`,
> selected when `PAYSTACK_SECRET_KEY` is set). **Every other provider returns its noop unconditionally** —
> even with credentials present — until its real impl is written in a later phase. So setting e.g.
> `DOJAH_API_KEY` today changes only a startup log line, not behavior.

---

## Paystack (Payments) — the only live provider

```typescript
interface PaymentProvider {
  readonly name: string;
  initiateCharge(input: ChargeInput): Promise<ChargeResult>;        // top-up; ChargeResult.authorizationUrl is the hosted page
  verifyCharge(reference: string): Promise<ChargeStatus>;           // 'pending' | 'success' | 'failed'
  initiateTransfer(input: TransferInput): Promise<TransferResult>;  // payout → bank (name, accountNumber, bankCode)
  verifyTransfer(reference: string): Promise<ChargeStatus>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean; // HMAC-SHA512 over the raw body
}
```

**Rules**
- All amounts in **kobo**. `reference` is the idempotency key.
- Webhook is `@Public()` and verified over the **raw** body before processing.
- Real `PaystackPaymentProvider` selected when `PAYSTACK_SECRET_KEY` is present; else noop.

**Noop:** `initiateCharge` → `noop://pay/{ref}`; `verifyCharge`/`verifyTransfer` → `'success'`;
`verifyWebhookSignature` → `true` (accepts all). Top-ups settle immediately so wallet flows are testable keyless.

---

## Dojah (Identity / NIN)

```typescript
interface IdentityProvider {
  readonly name: string;
  verifyNin(nin: string): Promise<NinVerificationResult>;  // { verified, provider, firstName?, lastName?, raw? }
}
```

**Rules**
- Takes the **NIN only** (no name/DOB args, no match-score in the contract). Required for drivers (KYC) and carpool participants.
- `KycStatus` lifecycle lives in the driver/identity modules, not the provider.

**Noop:** returns `{ verified: true, firstName: 'Dev', lastName: 'User' }` (auto-approve); logs the masked last-3 digits.

---

## AWS Rekognition (Liveness)

```typescript
interface LivenessProvider {
  readonly name: string;
  createSession(): Promise<LivenessSession>;          // { sessionId }
  getResult(sessionId: string): Promise<LivenessResult>;  // { isLive, confidence }
  verifySelfie(imageBase64: string): Promise<LivenessResult>;  // one-shot path
}
```

**Rules**
- Drivers use `createSession` + `getResult`; riders use the simpler one-shot `verifySelfie` (base64 from `expo-camera`).

**Noop:** session `'noop-session'`; `getResult`/`verifySelfie` → `{ isLive: true, confidence: 0.99 }` (auto-pass).

---

## AWS S3 (Storage)

```typescript
interface StorageProvider {
  readonly name: string;
  putObject(input: { key: string; body: Buffer | Uint8Array; contentType?: string }): Promise<{ url: string }>;
}
```

**Rules**
- Single method — **`putObject` only** (no signed-URL or delete in the contract). Driver/rider documents (license, NIN slip, photos); metadata in `documents`, binary in S3.

**Noop:** returns `noop://local/{key}` (no real upload).

---

## Google Maps (Maps)

```typescript
interface MapsProvider {
  readonly name: string;
  estimateTrip(query: { origin: GeoPoint; destination: GeoPoint; departureTime?: Date }): Promise<TripEstimate>;
  autocomplete(query: string, near?: GeoPoint): Promise<PlaceSuggestion[]>;
  reverseGeocode(lat: number, lng: number): Promise<string | null>;
}
```

**Rules**
- `estimateTrip` (distance + duration, optional `durationInTrafficSeconds`) feeds **pricing**.
- Autocomplete is **proxied through the backend** (`/places/*`) — no Google key in the mobile client.

**Noop (works keyless):** `estimateTrip` = haversine distance ÷ ~30 km/h (no traffic factor); `autocomplete`
and `reverseGeocode` hit **OpenStreetMap Nominatim** (keyless, `countrycodes=ng`, biased near a point). So
dev maps/pricing/places all function without Google.

---

## Termii (SMS)

```typescript
interface SmsProvider {
  readonly name: string;
  sendSms(input: { to: string; message: string }): Promise<DeliveryResult>;  // { success, id?, provider }
}
```

**Rules**
- Generic `message` (the OTP text is built by `otp.service.ts`, not the provider). Auth/OTP routes are throttled.

**Noop:** logs `[noop] sms -> {phone}: {message}`. The OTP message contains **`Your Kari code …`** — `grep "Your Kari code"` the backend log to read dev codes.

---

## Twilio (WhatsApp)

```typescript
interface WhatsAppProvider {
  readonly name: string;
  sendWhatsApp(input: { to: string; message: string }): Promise<DeliveryResult>;
}
```

**Rules**
- Alternative OTP channel — the rider chooses SMS vs WhatsApp at signup (`verify-method`). `TWILIO_WHATSAPP_FROM` carries the `whatsapp:` prefix.

**Noop:** logs `[noop] whatsapp -> {to}: {message}`.

---

## Twilio (Voice / masked calls)

```typescript
interface VoiceProvider {
  readonly name: string;
  connectMaskedCall(input: { fromNumber: string; toNumber: string; reference?: string }): Promise<MaskedCallResult>;
  // MaskedCallResult: { proxyNumber, sessionId, provider } — both parties see proxyNumber, real numbers stay hidden
}
```

**Rules**
- In-ride driver↔rider calls routed through a proxy number; gated to the two ride participants.

**Noop:** returns `proxyNumber '+2347000000000'` + a `sessionId`.

---

## Expo Push / FCM (Push) — planned

```typescript
interface PushProvider {
  readonly name: string;
  send(input: { to: string; title: string; body: string; data?: Record<string, unknown> }): Promise<DeliveryResult>;
}
```

**Rules**
- One channel in the notifications fan-out. `device_tokens` stores tokens per user. **Expo Push vs direct FCM is still undecided** (Phase 7).

**Noop:** logs `[noop] push -> {to}: {title}`, returns success.

---

## AWS SES (Email) — planned

```typescript
interface EmailProvider {
  readonly name: string;
  sendEmail(input: { to: string; subject: string; body: string; html?: boolean }): Promise<DeliveryResult>;
}
```

**Purpose**
- **Transactional email only** — the email branch of the notifications fan-out (`NotificationsProcessor`):
  ride receipts, account/security notices, ticket replies, panic confirmations. One message, one recipient.
- **Not marketing/bulk email.** Marketing (lists, campaigns, unsubscribe) is a **separate, post-MVP** concern — do not overload this interface.

**Rules**
- Primary impl: **AWS SES** (Kari is already on AWS; SES offers both an API and SMTP creds — so "your own SMTP" can just be SES-SMTP).
- Config: `EMAIL_FROM` (default `noreply@kari.ng`) + `EMAIL_API_KEY`. For SES-SMTP instead of the API, the impl/config carries SMTP host/port/user/pass (and `nodemailer` becomes a dep).

**Noop:** logs `[noop] email -> {to}: {subject}`, returns success. **This is the only impl today.**

---

## Testing Without Keys

The full stack runs **keyless**. Leave all provider env vars empty in `backend/.env` (and note: except
Payments, the providers stay noop **even if** you set keys, until their real impls land):

1. **OTP** → `grep "Your Kari code"` in the backend log (SMS + WhatsApp noops log the code)
2. **NIN** → auto-approved (`verified: true`)
3. **Liveness** → auto-passes (`isLive: true`)
4. **Payments** → mock references, top-ups settle immediately, webhooks accepted
5. **Maps** → real geocoding/autocomplete via **OSM Nominatim** (Nigeria); pricing via haversine estimate
6. **Storage** → mock `noop://local/...` URLs
7. **Push / Email / Voice** → logged to console

DI tokens (for wiring real impls later): `PAYMENT_PROVIDER`, `IDENTITY_PROVIDER`, `SMS_PROVIDER`,
`WHATSAPP_PROVIDER`, `STORAGE_PROVIDER`, `MAPS_PROVIDER`, `LIVENESS_PROVIDER`, `PUSH_PROVIDER`,
`EMAIL_PROVIDER`, `VOICE_PROVIDER`.
