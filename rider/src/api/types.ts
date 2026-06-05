import type {
  AccessibilityNeed,
  BehaviorPreference,
  CarCategory,
  CarpoolStatus,
  Gender,
  KycStatus,
  LedgerDirection,
  MusicPreference,
  NotificationChannel,
  PanicStatus,
  PaymentMethod,
  Personality,
  PriceType,
  RideStatus,
  RideType,
  ShuttleBookingStatus,
  ShuttleTripStatus,
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

// ─── Ride variants (Phase 5) ─────────────────────────────────────────────────
export interface CarpoolMember {
  riderId: string;
  shareAmount: number;
  isCreator: boolean;
}

export interface Carpool {
  id: string;
  creatorId: string;
  status: CarpoolStatus;
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
  totalFare: number;
  maxSeats: number;
  seatsTaken: number;
  departAt: string | null;
  members: CarpoolMember[];
  seatsAvailable: number;
}

export interface CarpoolCreateResult {
  carpool: Carpool;
  dispatchedTo: number;
}

export interface ShuttleStop {
  id: string;
  routeId: string;
  name: string;
  lat: number;
  lng: number;
  sequence: number;
  fareFromOrigin: number;
}

export interface ShuttleRoute {
  id: string;
  name: string;
  corridor: string;
  active: boolean;
  stops: ShuttleStop[];
}

export interface ShuttleTrip {
  id: string;
  routeId: string;
  routeName: string | null;
  departAt: string;
  capacity: number;
  seatsBooked: number;
  seatsAvailable: number;
  status: ShuttleTripStatus;
}

export interface ShuttleBooking {
  id: string;
  tripId: string;
  from: string | null;
  to: string | null;
  seats: number;
  fare: number;
  status: ShuttleBookingStatus;
  createdAt: string;
}

// ─── Safety & comms (Phase 6) ────────────────────────────────────────────────
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
}

export interface PanicEvent {
  id: string;
  status: PanicStatus;
  rideId: string | null;
  lat: number;
  lng: number;
  contactsAlerted: number;
  createdAt: string;
}

export interface SharedTripLink {
  token: string;
  rideId: string;
  url: string;
  expiresAt: string;
  active: boolean;
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

export interface MaskedCall {
  proxyNumber: string;
  sessionId: string;
  provider: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channels: NotificationChannel[] | null;
  read: boolean;
  createdAt: string;
}
