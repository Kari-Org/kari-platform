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

// ─── A2 · Fleet ────────────────────────────────────────────────────────────
export interface FleetDriver {
  driverId: string;
  name: string;
  lat: number;
  lng: number;
  availability: string;
  category: string | null;
  rideId: string | null;
  rideStatus: string | null;
}
export interface Fleet {
  drivers: FleetDriver[];
  counts: { total: number; online: number; onTrip: number };
}

// ─── A3 · Users / drivers / audit ────────────────────────────────────────────
export interface AdminDriverRow {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  driverType: string;
  availability: string;
  onboardingComplete: boolean;
  ninStatus: string;
  livenessVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  vehicle: {
    model: string;
    plateNumber: string;
    category: string;
    color: string | null;
    brand: string | null;
  } | null;
}

export interface UserDetail {
  user: AdminUserRow & { adminRole: string | null };
  profile: Record<string, unknown> | null;
  rides: AdminRide[];
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetId: string | null;
  method: string;
  path: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

// ─── A5 · Tickets ────────────────────────────────────────────────────────────
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export interface Ticket {
  id: string;
  requesterId: string;
  requesterRole: string;
  category: string;
  subject: string;
  message: string;
  status: TicketStatus;
  rideId: string | null;
  adminReply: string | null;
  handledById: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── A6 · Finance ──────────────────────────────────────────────────────────
export interface FinanceSummary {
  revenue: number;
  gmvAllTime: number;
  gmvToday: number;
  payouts: number;
  payoutCount: number;
  topups: number;
  topupCount: number;
}

export interface Payout {
  id: string;
  reference: string;
  amount: number;
  status: string;
  userId: string | null;
  provider: string | null;
  providerRef: string | null;
  createdAt: string;
}

export interface FareConfig {
  pricing: { baseFare: number; perKm: number; perMin: number; fuelIndex: number };
  commission: { commissionRateBps: number; commissionPct: number };
  cancellation: {
    cancellationFee: number;
    cancellationGraceSeconds: number;
    penaltyDriverShareBps: number;
    driverCancelFee: number;
  };
  wallet: { minTopup: number; minPayout: number };
}

export interface CreateDedicatedDriverBody {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  vehicleModel: string;
  plateNumber: string;
  category?: string;
}

export const adminApi = {
  // A1 — reads
  stats: () => apiFetch<Stats>('/admin/stats'),
  users: (q: { role?: string; search?: string; page?: number; limit?: number }) =>
    apiFetch<Paginated<AdminUserRow>>('/admin/users', { query: q }),
  user: (id: string) => apiFetch<UserDetail>(`/admin/users/${id}`),
  rides: (q: { status?: string; page?: number; limit?: number }) =>
    apiFetch<Paginated<AdminRide>>('/admin/rides', { query: q }),

  // A2 — fleet
  fleet: () => apiFetch<Fleet>('/admin/fleet'),

  // A3 — write actions
  setUserStatus: (id: string, status: string) =>
    apiFetch<{ id: string; status: string }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  verifyDriver: (id: string, approve: boolean) =>
    apiFetch<unknown>(`/admin/drivers/${id}/verify`, { method: 'POST', body: { approve } }),
  cancelRide: (id: string, reason?: string) =>
    apiFetch<unknown>(`/admin/rides/${id}/cancel`, { method: 'POST', body: { reason } }),
  audit: (q: { action?: string; page?: number; limit?: number }) =>
    apiFetch<Paginated<AuditEntry>>('/admin/audit', { query: q }),

  // A4 — dedicated drivers
  drivers: () => apiFetch<AdminDriverRow[]>('/admin/drivers'),
  createDedicated: (body: CreateDedicatedDriverBody) =>
    apiFetch<{ userId: string; email: string }>('/admin/drivers/dedicated', {
      method: 'POST',
      body,
    }),

  // A5 — tickets
  tickets: (q: { status?: string; page?: number; limit?: number }) =>
    apiFetch<Paginated<Ticket>>('/admin/tickets', { query: q }),
  updateTicket: (id: string, body: { status?: TicketStatus; reply?: string }) =>
    apiFetch<Ticket>(`/admin/tickets/${id}`, { method: 'PATCH', body }),

  // A6 — finance
  financeSummary: () => apiFetch<FinanceSummary>('/admin/finance/summary'),
  payouts: (q: { page?: number; limit?: number }) =>
    apiFetch<Paginated<Payout>>('/admin/finance/payouts', { query: q }),
  fareConfig: () => apiFetch<FareConfig>('/admin/fare-config'),
};
