import type { CarCategory, KycStatus, OtpChannel, UserRole } from '@kari/types';
import { apiFetch } from '@kari/mobile-core';
import type { AuthResult, DriverProfile, PublicUser, Ride } from './types';

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
