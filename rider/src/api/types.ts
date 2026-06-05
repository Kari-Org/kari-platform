import type {
  AccessibilityNeed,
  BehaviorPreference,
  CarCategory,
  Gender,
  KycStatus,
  LedgerDirection,
  MusicPreference,
  PaymentMethod,
  Personality,
  PriceType,
  RideStatus,
  RideType,
  SubscriptionStatus,
  TransactionType,
  UserRole,
  UserStatus,
} from '@kari/types';

/** Mirrors the backend's public user shape (see AuthService.toPublic). */
export interface PublicUser {
  id: string;
  role: UserRole;
  email: string;
  phone: string;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  lat: number;
  lng: number;
}

export interface RiderProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  preferredDriverBehavior: BehaviorPreference;
  gender: Gender | null;
  referralCode: string | null;
  musicPreference: MusicPreference | null;
  accessibilityNeed: AccessibilityNeed;
  promotionsOptIn: boolean;
  homeAddress: string | null;
  nin: string | null;
  ninStatus: KycStatus;
  livenessVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  addresses: SavedAddress[];
}

export interface Fare {
  category: CarCategory;
  amount: number;
}

export interface Quote {
  ref: string;
  distanceMeters: number;
  durationSeconds: number;
  fares: Fare[];
  negotiable: boolean;
  expiresInSeconds: number;
  pickup: { lat: number; lng: number; address: string | null };
  dropoff: { lat: number; lng: number; address: string | null };
}

export interface Ride {
  id: string;
  type: RideType;
  status: RideStatus;
  riderId: string;
  driverId: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string | null;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string | null;
  distanceMeters: number;
  durationSeconds: number;
  carCategory: CarCategory;
  priceType: PriceType;
  paymentMethod: PaymentMethod;
  quotedPrice: number;
  riderProposedPrice: number | null;
  agreedPrice: number | null;
  startOtp: string | null;
  driver?: DriverSummary | null;
  createdAt: string;
}

/** Counterparty summary the backend attaches to the rider's ride view. */
export interface DriverSummary {
  name: string;
  personality: Personality | null;
  ratingAvg: number;
  ratingCount: number;
  vehicle: {
    brand: string | null;
    model: string;
    color: string | null;
    plateNumber: string;
    category: CarCategory;
  } | null;
}

export interface RequestRideResult {
  ride: Ride;
  dispatchedTo: number;
}

// ─── Money (Phase 3) ─────────────────────────────────────────────────────────
export interface Wallet {
  walletId: string;
  currency: string;
  balanceKobo: number;
  balance: number;
}

export interface WalletTxn {
  id: string;
  type: TransactionType;
  direction: LedgerDirection;
  amountKobo: number;
  amount: number;
  balanceAfterKobo: number;
  balanceAfter: number;
  at: string;
}

export interface TopupInit {
  reference: string;
  authorizationUrl: string | null;
  amount: number;
  amountKobo: number;
  status: 'pending';
  provider: string;
}

export interface TxnView {
  reference: string;
  type: TransactionType;
  status: string;
  amountKobo: number;
  amount: number;
  rideId: string | null;
  provider: string | null;
  providerRef: string | null;
  createdAt: string;
}

// ─── Engagement (Phase 4) ────────────────────────────────────────────────────
export interface ReferralInfo {
  code: string;
  referredBy: string | null;
  rewarded: boolean;
  referralsCount: number;
  rewardNaira: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceNaira: number;
  billingCycleDays: number;
  includedRides: number | null;
  sameDriver: boolean;
  description: string;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  assignedDriverId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  ridesUsed: number;
  includedRides: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  driverId: string;
  name: string;
  points: number;
  rides: number;
}

export interface Leaderboard {
  weekKey: string;
  entries: LeaderboardEntry[];
}
