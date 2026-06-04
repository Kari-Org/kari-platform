import type {
  CarCategory,
  DriverAvailability,
  DriverType,
  KycStatus,
  PaymentMethod,
  Personality,
  PriceType,
  RideStatus,
  RideType,
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
