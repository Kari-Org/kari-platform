import type {
  AchievementBadge,
  CarCategory,
  DriverAvailability,
  DriverType,
  KycStatus,
  LedgerDirection,
  PaymentMethod,
  Personality,
  PriceType,
  RideStatus,
  RideType,
  TransactionType,
  UserRole,
  UserStatus,
} from '@kari/types';

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

export interface Vehicle {
  id: string;
  brand: string | null;
  model: string;
  year: number | null;
  plateNumber: string;
  color: string | null;
  category: CarCategory;
}

export interface DriverProfile {
  id: string;
  userId: string;
  driverType: DriverType;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  origin: string | null;
  personality: Personality | null;
  nin: string | null;
  ninStatus: KycStatus;
  livenessVerified: boolean;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  nokName: string | null;
  nokPhone: string | null;
  nokRelationship: string | null;
  spotifyInstalled: boolean;
  appleMusicInstalled: boolean;
  availability: DriverAvailability;
  onboardingComplete: boolean;
  ratingAvg: number;
  ratingCount: number;
  vehicle: Vehicle | null;
}

/** A ride from the driver's view (the start PIN is stripped server-side). */
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
  rider?: RiderSummary | null;
  createdAt: string;
}

/** Counterparty summary the backend attaches to the driver's ride view. */
export interface RiderSummary {
  name: string;
  ratingAvg: number;
  ratingCount: number;
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

/** Shape returned by a payout request (transaction view). */
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

/** Driver earnings summary (gross, commission, penalties, payouts, balance). */
export interface DriverEarnings {
  balanceKobo: number;
  balance: number;
  grossEarningsKobo: number;
  grossEarnings: number;
  commissionPaidKobo: number;
  commissionPaid: number;
  penaltiesKobo: number;
  penalties: number;
  cancellationCompensationKobo: number;
  cancellationCompensation: number;
  paidOutKobo: number;
  paidOut: number;
}

// ─── Engagement (Phase 4) ────────────────────────────────────────────────────
export interface ReferralInfo {
  code: string;
  referredBy: string | null;
  rewarded: boolean;
  referralsCount: number;
  rewardNaira: number;
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

export interface GamificationSummary {
  weekKey: string;
  weekPoints: number;
  weekRides: number;
  weekRank: number | null;
  allTimePoints: number;
  allTimeRides: number;
  commissionReductionBps: number;
  achievementsUnlocked: number;
}

export interface AchievementView {
  badge: AchievementBadge;
  unlocked: boolean;
  unlockedAt: string | null;
}
