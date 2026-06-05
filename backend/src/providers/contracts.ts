import type { GeoPoint } from '@kari/types';

/** Shared shape for fire-and-forget delivery channels (SMS, WhatsApp, push). */
export interface DeliveryResult {
  success: boolean;
  id?: string;
  provider: string;
}

// ─── Payments (Paystack) ─────────────────────────────────────────────────────
export interface ChargeInput {
  amount: number; // minor units (kobo)
  currency?: string;
  email: string;
  reference: string;
  metadata?: Record<string, unknown>;
}
export interface ChargeResult {
  reference: string;
  authorizationUrl?: string;
  provider: string;
}
export type ChargeStatus = 'pending' | 'success' | 'failed';

/** A bank payout (wallet → driver's bank account) via the gateway's transfer API. */
export interface TransferInput {
  amount: number; // minor units (kobo)
  currency?: string;
  reference: string;
  recipient: {
    name: string;
    accountNumber: string;
    bankCode: string; // gateway bank code (e.g. Paystack NUBAN code)
  };
  reason?: string;
  metadata?: Record<string, unknown>;
}
export interface TransferResult {
  reference: string;
  providerRef?: string; // gateway transfer code / id
  status: ChargeStatus;
  provider: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** Start an inbound charge (top-up). Returns a hosted authorization URL when applicable. */
  initiateCharge(input: ChargeInput): Promise<ChargeResult>;
  verifyCharge(reference: string): Promise<ChargeStatus>;
  /** Start an outbound transfer (payout) to a bank account. */
  initiateTransfer(input: TransferInput): Promise<TransferResult>;
  verifyTransfer(reference: string): Promise<ChargeStatus>;
  /** Validate a gateway webhook against the raw request body (HMAC). */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

// ─── Identity / NIN (Dojah) ──────────────────────────────────────────────────
export interface NinVerificationResult {
  verified: boolean;
  provider: string;
  firstName?: string;
  lastName?: string;
  raw?: unknown;
}
export interface IdentityProvider {
  readonly name: string;
  verifyNin(nin: string): Promise<NinVerificationResult>;
}

// ─── Messaging (Termii SMS, Twilio WhatsApp) ─────────────────────────────────
export interface SendMessageInput {
  to: string;
  message: string;
}
export interface SmsProvider {
  readonly name: string;
  sendSms(input: SendMessageInput): Promise<DeliveryResult>;
}
export interface WhatsAppProvider {
  readonly name: string;
  sendWhatsApp(input: SendMessageInput): Promise<DeliveryResult>;
}

// ─── Storage (AWS S3) ────────────────────────────────────────────────────────
export interface PutObjectInput {
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string;
}
export interface StorageProvider {
  readonly name: string;
  putObject(input: PutObjectInput): Promise<{ url: string }>;
}

// ─── Maps / traffic (Google) ─────────────────────────────────────────────────
export interface TripQuery {
  origin: GeoPoint;
  destination: GeoPoint;
  departureTime?: Date;
}
export interface TripEstimate {
  distanceMeters: number;
  durationSeconds: number;
  durationInTrafficSeconds?: number;
  provider: string;
}
export interface PlaceSuggestion {
  placeId: string;
  description: string;
  lat: number;
  lng: number;
}
export interface MapsProvider {
  readonly name: string;
  estimateTrip(query: TripQuery): Promise<TripEstimate>;
  /** Address autocomplete suggestions, optionally biased around a point. */
  autocomplete(query: string, near?: GeoPoint): Promise<PlaceSuggestion[]>;
  /** Reverse-geocode a point to a human-readable address (null if unknown). */
  reverseGeocode(lat: number, lng: number): Promise<string | null>;
}

// ─── Liveness (AWS Rekognition) ──────────────────────────────────────────────
export interface LivenessSession {
  sessionId: string;
}
export interface LivenessResult {
  isLive: boolean;
  confidence: number;
}
export interface LivenessProvider {
  readonly name: string;
  createSession(): Promise<LivenessSession>;
  getResult(sessionId: string): Promise<LivenessResult>;
  /** One-shot selfie check (base64). Riders use this simpler path; drivers
   *  use the session + getResult pair. */
  verifySelfie(imageBase64: string): Promise<LivenessResult>;
}

// ─── Push (Expo / FCM) ───────────────────────────────────────────────────────
export interface PushInput {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
export interface PushProvider {
  readonly name: string;
  send(input: PushInput): Promise<DeliveryResult>;
}

// ─── Email ───────────────────────────────────────────────────────────────────
export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  html?: boolean;
}
export interface EmailProvider {
  readonly name: string;
  sendEmail(input: SendEmailInput): Promise<DeliveryResult>;
}

// ─── Voice / masked calls (Twilio) ───────────────────────────────────────────
export interface MaskedCallInput {
  fromNumber: string;
  toNumber: string;
  reference?: string;
}
export interface MaskedCallResult {
  /** The proxy number both parties dial/see — real numbers stay hidden. */
  proxyNumber: string;
  sessionId: string;
  provider: string;
}
export interface VoiceProvider {
  readonly name: string;
  connectMaskedCall(input: MaskedCallInput): Promise<MaskedCallResult>;
}

// ─── DI tokens ───────────────────────────────────────────────────────────────
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');
export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
export const MAPS_PROVIDER = Symbol('MAPS_PROVIDER');
export const LIVENESS_PROVIDER = Symbol('LIVENESS_PROVIDER');
export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');
export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
export const VOICE_PROVIDER = Symbol('VOICE_PROVIDER');
