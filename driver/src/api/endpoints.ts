import type { CarCategory, KycStatus, OtpChannel, UserRole } from '@kari/types';
import { apiFetch } from '@kari/mobile-core';
import type {
  AchievementView,
  AppNotification,
  AuthResult,
  Carpool,
  ChatMessage,
  DriverEarnings,
  DriverProfile,
  EmergencyContact,
  GamificationSummary,
  Leaderboard,
  MaskedCall,
  PanicEvent,
  PublicUser,
  ReferralInfo,
  Ride,
  SharedTripLink,
  ShuttleRoute,
  ShuttleTrip,
  SupportTicket,
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

  me: () => apiFetch<PublicUser>('/auth/me'),

  forgotPassword: (body: { phone: string; channel?: OtpChannel }) =>
    apiFetch<{ channel: OtpChannel; expiresInSeconds: number }>('/auth/forgot-password', {
      method: 'POST',
      body,
      auth: false,
    }),

  resetPassword: (body: { phone: string; code: string; newPassword: string }) =>
    apiFetch<{ success: boolean }>('/auth/reset-password', { method: 'POST', body, auth: false }),
};

export const driversApi = {
  me: () => apiFetch<DriverProfile>('/drivers/me'),
  setPersonal: (body: { firstName: string; lastName: string; dateOfBirth: string; origin: string }) =>
    apiFetch<DriverProfile>('/drivers/onboarding/personal', { method: 'POST', body }),
  setQuiz: (body: { answers: number[] }) =>
    apiFetch<DriverProfile>('/drivers/onboarding/quiz', { method: 'POST', body }),
  setVehicle: (body: {
    brand?: string;
    model: string;
    year?: number;
    plateNumber: string;
    color?: string;
    category?: CarCategory;
  }) => apiFetch<DriverProfile>('/drivers/onboarding/vehicle', { method: 'POST', body }),
  setDetails: (body: {
    bankAccountNumber: string;
    bankName: string;
    bankAccountName: string;
    nokName: string;
    nokPhone: string;
    nokRelationship: string;
    spotifyInstalled?: boolean;
    appleMusicInstalled?: boolean;
  }) => apiFetch<DriverProfile>('/drivers/onboarding/details', { method: 'POST', body }),
  submitNin: (body: { nin: string }) =>
    apiFetch<{ verified: boolean; status: KycStatus }>('/drivers/onboarding/nin', {
      method: 'POST',
      body,
    }),
  livenessSession: () =>
    apiFetch<{ sessionId: string }>('/drivers/onboarding/liveness/session', { method: 'POST' }),
  livenessCheck: (body: { sessionId: string }) =>
    apiFetch<{ isLive: boolean; confidence: number }>('/drivers/onboarding/liveness/check', {
      method: 'POST',
      body,
    }),
  completeOnboarding: () =>
    apiFetch<DriverProfile>('/drivers/onboarding/complete', { method: 'POST' }),
};

export const availabilityApi = {
  online: (body: { lat: number; lng: number }) =>
    apiFetch<{ availability: string }>('/availability/online', { method: 'POST', body }),
  location: (body: { lat: number; lng: number }) =>
    apiFetch<{ ok: boolean }>('/availability/location', { method: 'POST', body }),
  offline: () => apiFetch<{ availability: string }>('/availability/offline', { method: 'POST' }),
};

export const ridesApi = {
  get: (id: string) => apiFetch<Ride>(`/rides/${id}`),
  mine: () => apiFetch<Ride[]>('/rides/mine'),
  accept: (id: string) => apiFetch<Ride>(`/rides/${id}/accept`, { method: 'POST' }),
  offer: (id: string, amount: number) =>
    apiFetch<{ id: string; amount: number; status: string }>(`/rides/${id}/offer`, {
      method: 'POST',
      body: { amount },
    }),
  arrived: (id: string) => apiFetch<Ride>(`/rides/${id}/arrived`, { method: 'POST' }),
  start: (id: string, otp: string) =>
    apiFetch<Ride>(`/rides/${id}/start`, { method: 'POST', body: { otp } }),
  complete: (id: string) => apiFetch<Ride>(`/rides/${id}/complete`, { method: 'POST' }),
  cancel: (id: string, reason?: string) =>
    apiFetch<Ride>(`/rides/${id}/cancel`, { method: 'POST', body: { reason } }),
  rate: (id: string, body: { stars: number; comment?: string }) =>
    apiFetch(`/rides/${id}/rate`, { method: 'POST', body }),
};

// ─── Money (Phase 3) ─────────────────────────────────────────────────────────
export const walletApi = {
  summary: () => apiFetch<Wallet>('/wallet'),
  transactions: () => apiFetch<WalletTxn[]>('/wallet/transactions'),
  payout: (amount: number) =>
    apiFetch<TxnView>('/wallet/payout', { method: 'POST', body: { amount } }),
};

export const paymentsApi = {
  earnings: () => apiFetch<DriverEarnings>('/payments/earnings'),
};

// ─── Engagement (Phase 4) ────────────────────────────────────────────────────
export const gamificationApi = {
  leaderboard: () => apiFetch<Leaderboard>('/leaderboard'),
  me: () => apiFetch<GamificationSummary>('/gamification/me'),
  achievements: () => apiFetch<AchievementView[]>('/gamification/achievements'),
};

export const referralsApi = {
  me: () => apiFetch<ReferralInfo>('/referrals/me'),
  apply: (code: string) =>
    apiFetch<{ applied: boolean; rewardOnFirstRide: number }>('/referrals/apply', {
      method: 'POST',
      body: { code },
    }),
};

export const ticketsApi = {
  mine: () => apiFetch<SupportTicket[]>('/tickets/mine'),
  create: (body: { subject: string; message: string; category?: string; rideId?: string }) =>
    apiFetch<SupportTicket>('/tickets', { method: 'POST', body }),
};

// ─── Ride variants (Phase 5) ─────────────────────────────────────────────────
export const carpoolsApi = {
  get: (id: string) => apiFetch<Carpool>(`/carpools/${id}`),
  accept: (id: string) => apiFetch<Carpool>(`/carpools/${id}/accept`, { method: 'POST' }),
  complete: (id: string) => apiFetch<Carpool>(`/carpools/${id}/complete`, { method: 'POST' }),
  cancel: (id: string) => apiFetch<Carpool>(`/carpools/${id}/cancel`, { method: 'POST' }),
};

export const shuttleApi = {
  routes: () => apiFetch<ShuttleRoute[]>('/shuttle/routes'),
  trips: (routeId?: string) =>
    apiFetch<ShuttleTrip[]>(
      `/shuttle/trips${routeId ? `?routeId=${encodeURIComponent(routeId)}` : ''}`,
    ),
};

// ─── Safety & comms (Phase 6) ────────────────────────────────────────────────
export const safetyApi = {
  contacts: () => apiFetch<EmergencyContact[]>('/safety/contacts'),
  addContact: (body: { name: string; phone: string; relationship?: string }) =>
    apiFetch<EmergencyContact>('/safety/contacts', { method: 'POST', body }),
  removeContact: (id: string) =>
    apiFetch<{ removed: boolean }>(`/safety/contacts/${id}`, { method: 'DELETE' }),
  panic: (body: { rideId?: string; lat: number; lng: number }) =>
    apiFetch<PanicEvent>('/safety/panic', { method: 'POST', body }),
  share: (rideId: string) =>
    apiFetch<SharedTripLink>(`/rides/${rideId}/share`, { method: 'POST' }),
  stopShare: (rideId: string) =>
    apiFetch<{ stopped: number }>(`/rides/${rideId}/share/stop`, { method: 'POST' }),
};

export const commsApi = {
  messages: (rideId: string) => apiFetch<ChatMessage[]>(`/rides/${rideId}/messages`),
  send: (rideId: string, body: string) =>
    apiFetch<ChatMessage>(`/rides/${rideId}/messages`, { method: 'POST', body: { body } }),
  call: (rideId: string) => apiFetch<MaskedCall>(`/rides/${rideId}/call`, { method: 'POST' }),
};

export const notificationsApi = {
  list: () => apiFetch<AppNotification[]>('/notifications'),
  markRead: (id: string) =>
    apiFetch<AppNotification>(`/notifications/${id}/read`, { method: 'POST' }),
  registerDevice: (body: { token: string; platform?: string }) =>
    apiFetch('/notifications/devices', { method: 'POST', body }),
};
