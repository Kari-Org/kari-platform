import { apiFetch } from './api';

export interface Stats {
  ridersTotal: number;
  driversTotal: number;
  driversOnboarded: number;
  driversOnline: number;
  driversOnTrip: number;
  ridesTotal: number;
  activeRides: number;
  ridesToday: number;
  gmvToday: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UserProfileSummary {
  name: string;
  ratingAvg: number;
  ratingCount: number;
  onboardingComplete?: boolean;
  availability?: string;
  driverType?: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  profile: UserProfileSummary | null;
}

export interface AdminRide {
  id: string;
  status: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  carCategory: string;
  priceType: string;
  paymentMethod: string;
  quotedPrice: number;
  agreedPrice: number | null;
  distanceMeters: number;
  createdAt: string;
  riderId: string;
  driverId: string | null;
}

export const adminApi = {
  stats: () => apiFetch<Stats>('/admin/stats'),
  users: (q: { role?: string; search?: string; page?: number; limit?: number }) =>
    apiFetch<Paginated<AdminUserRow>>('/admin/users', { query: q }),
  user: (id: string) =>
    apiFetch<{ user: AdminUserRow; profile: unknown; rides: AdminRide[] }>(`/admin/users/${id}`),
  rides: (q: { status?: string; page?: number; limit?: number }) =>
    apiFetch<Paginated<AdminRide>>('/admin/rides', { query: q }),
};
