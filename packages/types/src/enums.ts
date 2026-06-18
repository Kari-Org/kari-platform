/**
 * Shared domain enums. Values are strings so they map 1:1 to DB columns
 * (the "enums as strings" decision) and serialize cleanly over the wire.
 */

export enum UserRole {
  DRIVER = 'DRIVER',
  RIDER = 'RIDER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

/** Freelance = self-onboarded in-app; Dedicated = admin-onboarded, salaried. */
export enum DriverType {
  FREELANCE = 'FREELANCE',
  DEDICATED = 'DEDICATED',
}

/** Driver personality from the onboarding quiz; also the rider's match preference. */
export enum Personality {
  TALKATIVE = 'TALKATIVE',
  RESERVED = 'RESERVED',
  NEUTRAL = 'NEUTRAL',
}

/** Rider preference adds NO_PREFERENCE on top of the personality set. */
export enum BehaviorPreference {
  TALKATIVE = 'TALKATIVE',
  RESERVED = 'RESERVED',
  NEUTRAL = 'NEUTRAL',
  NO_PREFERENCE = 'NO_PREFERENCE',
}

/** Rider's self-reported gender (Additional Information step). */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

/** Rider's music preference during a ride (preferences survey). */
export enum MusicPreference {
  OWN_PLAYLIST = 'OWN_PLAYLIST',
  DRIVER_CHOICE = 'DRIVER_CHOICE',
  SILENCE = 'SILENCE',
}

/** Rider's accessibility requirement (preferences survey). */
export enum AccessibilityNeed {
  WHEELCHAIR = 'WHEELCHAIR',
  CHILD_SEAT = 'CHILD_SEAT',
  NONE = 'NONE',
}

export enum DriverAvailability {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  ON_TRIP = 'ON_TRIP',
}

export enum RideType {
  SOLO = 'SOLO',
  CARPOOL = 'CARPOOL',
  SHUTTLE = 'SHUTTLE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum RideStatus {
  SEARCHING = 'SEARCHING',
  OFFERED = 'OFFERED',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CarCategory {
  ECONOMY = 'ECONOMY',
  COMFORT = 'COMFORT',
  PREMIUM = 'PREMIUM',
}

export enum PriceType {
  STANDARD = 'STANDARD',
  NEGOTIATE = 'NEGOTIATE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET',
  IN_APP_TRANSFER = 'IN_APP_TRANSFER',
}

export enum OtpChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum OtpPurpose {
  SIGNUP = 'SIGNUP',
  RIDE_START = 'RIDE_START',
  PASSWORD_RESET = 'PASSWORD_RESET',
  LOGIN = 'LOGIN',
}

/** Identity / KYC verification lifecycle (documents, NIN, liveness). */
export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum LedgerDirection {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionType {
  TOPUP = 'TOPUP',
  RIDE_CHARGE = 'RIDE_CHARGE',
  RIDE_PAYOUT = 'RIDE_PAYOUT',
  COMMISSION = 'COMMISSION',
  REFUND = 'REFUND',
  PENALTY = 'PENALTY',
  REWARD = 'REWARD',
  /** Recurring subscription plan charge (Phase 4). */
  SUBSCRIPTION = 'SUBSCRIPTION',
  /** Referral bonus credited to referrer/referee (Phase 4). */
  REFERRAL = 'REFERRAL',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

/** Documents collected during driver/rider onboarding (stored in S3). */
export enum DocumentType {
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  NIN_SLIP = 'NIN_SLIP',
  PROFILE_PHOTO = 'PROFILE_PHOTO',
  VEHICLE_PHOTO = 'VEHICLE_PHOTO',
  VEHICLE_PARTICULARS = 'VEHICLE_PARTICULARS',
}

/** Labels for a rider's saved addresses. */
export enum AddressLabel {
  HOME = 'HOME',
  WORK = 'WORK',
  OTHER = 'OTHER',
}

/** Status of a driver's counter-offer on a negotiable ride. */
export enum NegotiationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// ─── Money (Phase 3) ─────────────────────────────────────────────────────────

/** Lifecycle of a money Transaction (gateway leg + ledger postings). */
export enum TransactionStatus {
  /** Created, awaiting gateway confirmation (e.g. top-up not yet paid). */
  PENDING = 'PENDING',
  /** Confirmed; ledger entries posted. */
  SUCCESS = 'SUCCESS',
  /** Gateway declined / abandoned; no ledger impact. */
  FAILED = 'FAILED',
  /** Posted then reversed by a compensating transaction. */
  REVERSED = 'REVERSED',
}

/** Who owns a wallet: an end user, or a platform-internal system account. */
export enum WalletOwnerType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

/**
 * Stable keys for the platform's singleton system wallets. Double-entry needs a
 * counterparty for every user-facing leg:
 * - REVENUE — commission earned + the platform's share of cancellation penalties.
 * - GATEWAY — clearing account for money in transit to/from Paystack (top-ups in, payouts out).
 */
export enum SystemAccount {
  REVENUE = 'REVENUE',
  GATEWAY = 'GATEWAY',
}

// ─── Engagement (Phase 4) ────────────────────────────────────────────────────

/**
 * Driver achievement badges, unlocked as drivers hit milestones. Surfaced in the
 * app and feed the gamification/engagement loops.
 */
export enum AchievementBadge {
  FIRST_RIDE = 'FIRST_RIDE',
  TEN_RIDES = 'TEN_RIDES',
  FIFTY_RIDES = 'FIFTY_RIDES',
  HUNDRED_RIDES = 'HUNDRED_RIDES',
  TOP_RATED = 'TOP_RATED',
}

// ─── Ride variants (Phase 5) ─────────────────────────────────────────────────

/** A shared carpool ride forming up, dispatched, and settled across members. */
export enum CarpoolStatus {
  OPEN = 'OPEN', // accepting members, awaiting a driver
  MATCHED = 'MATCHED', // a driver accepted; still joinable until full/departure
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** A scheduled shuttle run along a fixed route. */
export enum ShuttleTripStatus {
  SCHEDULED = 'SCHEDULED',
  BOARDING = 'BOARDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** A rider's seat reservation on a shuttle trip. */
export enum ShuttleBookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

// ─── Safety & Comms (Phase 6) ────────────────────────────────────────────────

/** Channels a notification fans out to. */
export enum NotificationChannel {
  PUSH = 'PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

/** Lifecycle of a panic alert. */
export enum PanicStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}
