import type {
  AccessibilityNeed,
  BehaviorPreference,
  CarCategory,
  Gender,
  KycStatus,
  MusicPreference,
  OtpChannel,
  PaymentMethod,
  PriceType,
  UserRole,
} from '@kari/types';
import { apiFetch } from './client';
import type {
  AuthResult,
  Leaderboard,
  PlaceSuggestion,
  PublicUser,
  Quote,
  ReferralInfo,
  RequestRideResult,
  Ride,
  RiderProfile,
  SavedAddress,
  Subscription,
  SubscriptionPlan,
  TopupInit,
  TxnView,
  Wallet,
  WalletTxn,
} from './types';

export const authApi = {
  signup: (body: {
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    channel?: OtpChannel;
  }) =>
    apiFetch<{
      userId: string;
      phone: string;
      otp: { channel: OtpChannel; expiresInSeconds: number };
    }>('/auth/signup', { method: 'POST', body, auth: false }),

  sendOtp: (body: { phone: string; channel?: OtpChannel }) =>
    apiFetch<{ channel: OtpChannel; expiresInSeconds: number }>('/auth/send-otp', {
      method: 'POST',
      body,
      auth: false,
    }),

  verify: (body: { phone: string; code: string }) =>
    apiFetch<AuthResult>('/auth/verify', { method: 'POST', body, auth: false }),

  login: (body: { identifier: string; password: string }) =>
    apiFetch<AuthResult>('/auth/login', { method: 'POST', body, auth: false }),

  google: (body: { idToken: string }) =>
    apiFetch<AuthResult & { isNewUser: boolean }>('/auth/google', {
      method: 'POST',
      body,
      auth: false,
    }),

  forgotPassword: (body: { phone: string; channel?: OtpChannel }) =>
    apiFetch<{ channel: OtpChannel; expiresInSeconds: number }>('/auth/forgot-password', {
      method: 'POST',
      body,
      auth: false,
    }),

  resetPassword: (body: { phone: string; code: string; newPassword: string }) =>
    apiFetch<{ success: boolean }>('/auth/reset-password', { method: 'POST', body, auth: false }),

  me: () => apiFetch<PublicUser>('/auth/me'),
};

export const ridersApi = {
  me: () => apiFetch<RiderProfile>('/riders/me'),
  setProfile: (body: {
    firstName: string;
    lastName: string;
    preferredDriverBehavior?: BehaviorPreference;
    gender?: Gender;
    referralCode?: string;
  }) => apiFetch<RiderProfile>('/riders/onboarding/profile', { method: 'POST', body }),
  setPreferences: (body: {
    preferredDriverBehavior?: BehaviorPreference;
    musicPreference?: MusicPreference;
    accessibilityNeed?: AccessibilityNeed;
    promotionsOptIn?: boolean;
    homeAddress?: string;
  }) => apiFetch<RiderProfile>('/riders/onboarding/preferences', { method: 'POST', body }),
  submitNin: (body: { nin: string }) =>
    apiFetch<{ verified: boolean; status: KycStatus }>('/riders/nin', { method: 'POST', body }),
  liveness: (body: { image: string }) =>
    apiFetch<{ verified: boolean }>('/riders/liveness', { method: 'POST', body }),
  addAddress: (body: { label: string; address: string; lat: number; lng: number }) =>
    apiFetch<SavedAddress>('/riders/addresses', { method: 'POST', body }),
  listAddresses: () => apiFetch<SavedAddress[]>('/riders/addresses'),
};

export const placesApi = {
  autocomplete: (q: string, near?: { lat: number; lng: number }) => {
    const qs =
      `q=${encodeURIComponent(q)}` + (near ? `&lat=${near.lat}&lng=${near.lng}` : '');
    return apiFetch<PlaceSuggestion[]>(`/places/autocomplete?${qs}`);
  },
  reverse: (lat: number, lng: number) =>
    apiFetch<{ address: string | null }>(`/places/reverse?lat=${lat}&lng=${lng}`),
};

export const ridesApi = {
  quote: (body: {
    pickupLat: number;
    pickupLng: number;
    pickupAddress?: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress?: string;
  }) => apiFetch<Quote>('/rides/quote', { method: 'POST', body }),

  request: (body: {
    quoteRef: string;
    carCategory: CarCategory;
    paymentMethod?: PaymentMethod;
    priceType?: PriceType;
    riderProposedPrice?: number;
  }) => apiFetch<RequestRideResult>('/rides', { method: 'POST', body }),

  get: (id: string) => apiFetch<Ride>(`/rides/${id}`),
  mine: () => apiFetch<Ride[]>('/rides/mine'),
  cancel: (id: string, reason?: string) =>
    apiFetch<Ride>(`/rides/${id}/cancel`, { method: 'POST', body: { reason } }),
  rate: (id: string, body: { stars: number; comment?: string }) =>
    apiFetch(`/rides/${id}/rate`, { method: 'POST', body }),
  acceptOffer: (id: string, offerId: string) =>
    apiFetch<Ride>(`/rides/${id}/offers/${offerId}/accept`, { method: 'POST' }),
};

// ─── Money (Phase 3) ─────────────────────────────────────────────────────────
export const walletApi = {
  summary: () => apiFetch<Wallet>('/wallet'),
  transactions: () => apiFetch<WalletTxn[]>('/wallet/transactions'),
  topup: (amount: number) =>
    apiFetch<TopupInit>('/wallet/topup', { method: 'POST', body: { amount } }),
  verify: (reference: string) =>
    apiFetch<TxnView>(`/wallet/topup/${encodeURIComponent(reference)}/verify`, { method: 'POST' }),
};

// ─── Engagement (Phase 4) ────────────────────────────────────────────────────
export const referralsApi = {
  me: () => apiFetch<ReferralInfo>('/referrals/me'),
  apply: (code: string) =>
    apiFetch<{ applied: boolean; rewardOnFirstRide: number }>('/referrals/apply', {
      method: 'POST',
      body: { code },
    }),
};

export const subscriptionsApi = {
  plans: () => apiFetch<SubscriptionPlan[]>('/subscriptions/plans'),
  mine: () => apiFetch<Subscription[]>('/subscriptions/mine'),
  subscribe: (planId: string) =>
    apiFetch<Subscription>('/subscriptions', { method: 'POST', body: { planId } }),
  cancel: (id: string) => apiFetch<Subscription>(`/subscriptions/${id}/cancel`, { method: 'POST' }),
};

export const gamificationApi = {
  leaderboard: () => apiFetch<Leaderboard>('/leaderboard'),
};
