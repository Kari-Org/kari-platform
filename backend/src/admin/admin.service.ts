import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import {
  CarCategory,
  DriverAvailability,
  DriverType,
  KycStatus,
  RideStatus,
  SystemAccount,
  TransactionStatus,
  TransactionType,
  UserRole,
  UserStatus,
} from '@kari/types';
import { PasswordService } from '../auth/services/password.service';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { DriverService } from '../driver/driver.service';
import { DriverProfile } from '../driver/entities/driver-profile.entity';
import { LedgerService } from '../money/ledger.service';
import { Transaction } from '../money/entities/transaction.entity';
import { RealtimeService } from '../realtime/realtime.service';
import { RiderProfile } from '../rider/entities/rider-profile.entity';
import { Ride } from '../rides/entities/ride.entity';
import { MatchingService } from '../rides/matching.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { TicketsService } from '../tickets/tickets.service';
import { TicketStatus } from '../tickets/entities/ticket.entity';
import type { UpdateTicketDto } from '../tickets/dto/update-ticket.dto';
import { AuditService } from './audit/audit.service';
import type { CreateDedicatedDriverDto } from './dto/create-dedicated-driver.dto';

const ACTIVE_DRIVING = [RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVED, RideStatus.IN_PROGRESS];

const ACTIVE_RIDE_STATUSES = [
  RideStatus.SEARCHING,
  RideStatus.OFFERED,
  RideStatus.NEGOTIATING,
  RideStatus.ACCEPTED,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.IN_PROGRESS,
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fullName(p: { firstName: string | null; lastName: string | null }): string {
  return [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
}

/** Drops the rider start PIN before a ride is returned to an admin. */
function stripPin(ride: Ride): Record<string, unknown> {
  const obj: Record<string, unknown> = { ...ride };
  delete obj.startOtp;
  return obj;
}

interface Page {
  page: number;
  limit: number;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly users: UsersService,
    private readonly password: PasswordService,
    private readonly drivers: DriverService,
    private readonly matching: MatchingService,
    private readonly ledger: LedgerService,
    private readonly realtime: RealtimeService,
    private readonly audit: AuditService,
    private readonly tickets: TicketsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(RiderProfile) private readonly riderRepo: Repository<RiderProfile>,
    @InjectRepository(DriverProfile) private readonly driverRepo: Repository<DriverProfile>,
    @InjectRepository(Transaction) private readonly txnRepo: Repository<Transaction>,
  ) {}

  /**
   * Admin-managed onboarding for dedicated (salaried) drivers. Unlike freelance
   * self-onboarding, the account is created active and pre-verified, and the
   * profile is marked complete (dedicated drivers are vetted off-platform).
   */
  async createDedicatedDriver(dto: CreateDedicatedDriverDto) {
    const existing = await this.users.findByEmailOrPhone(dto.email, dto.phone);
    if (existing) {
      throw new ConflictException('email or phone already registered');
    }
    const passwordHash = await this.password.hash(dto.password);
    const user = await this.users.createActive({
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: UserRole.DRIVER,
    });

    const profile = await this.drivers.getOrCreate(user.id);
    profile.driverType = DriverType.DEDICATED;
    profile.firstName = dto.firstName;
    profile.lastName = dto.lastName;
    profile.onboardingComplete = true;
    profile.vehicle = this.drivers.buildVehicle({
      model: dto.vehicleModel,
      plateNumber: dto.plateNumber,
      category: dto.category ?? CarCategory.COMFORT,
    });
    await this.drivers.save(profile);

    return {
      userId: user.id,
      email: user.email,
      driverType: profile.driverType,
      onboardingComplete: profile.onboardingComplete,
    };
  }

  listDrivers() {
    return this.drivers.list();
  }

  /** Dashboard KPIs — counts + today's gross merchandise value. */
  async stats() {
    const today = startOfToday();
    const [
      ridersTotal,
      driversTotal,
      driversOnboarded,
      driversOnline,
      driversOnTrip,
      ridesTotal,
      activeRides,
      ridesToday,
    ] = await Promise.all([
      this.userRepo.count({ where: { role: UserRole.RIDER } }),
      this.userRepo.count({ where: { role: UserRole.DRIVER } }),
      this.driverRepo.count({ where: { onboardingComplete: true } }),
      this.driverRepo.count({ where: { availability: DriverAvailability.ONLINE } }),
      this.driverRepo.count({ where: { availability: DriverAvailability.ON_TRIP } }),
      this.rideRepo.count(),
      this.rideRepo.count({ where: { status: In(ACTIVE_RIDE_STATUSES) } }),
      this.rideRepo.count({ where: { createdAt: MoreThanOrEqual(today) } }),
    ]);
    const gmvRow = await this.rideRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r."agreedPrice"), 0)', 'sum')
      .where('r.status = :s', { s: RideStatus.COMPLETED })
      .andWhere('r."createdAt" >= :d', { d: today })
      .getRawOne<{ sum: string }>();

    return {
      ridersTotal,
      driversTotal,
      driversOnboarded,
      driversOnline,
      driversOnTrip,
      ridesTotal,
      activeRides,
      ridesToday,
      gmvToday: Number(gmvRow?.sum ?? 0),
    };
  }

  /** Paginated users, filterable by role + email/phone search, with a profile summary. */
  async listUsers(params: Page & { role?: UserRole; search?: string }) {
    const { role, search, page, limit } = params;
    const qb = this.userRepo
      .createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (role) qb.andWhere('u.role = :role', { role });
    if (search) qb.andWhere('(u.email ILIKE :q OR u.phone ILIKE :q)', { q: `%${search}%` });
    const [rows, total] = await qb.getManyAndCount();

    const ids = rows.map((u) => u.id);
    const profiles = new Map<string, Record<string, unknown>>();
    if (ids.length && role === UserRole.DRIVER) {
      for (const p of await this.driverRepo.find({ where: { userId: In(ids) } })) {
        profiles.set(p.userId, {
          name: fullName(p),
          ratingAvg: Number(p.ratingAvg ?? 0),
          ratingCount: p.ratingCount ?? 0,
          onboardingComplete: p.onboardingComplete,
          availability: p.availability,
          driverType: p.driverType,
        });
      }
    } else if (ids.length && role === UserRole.RIDER) {
      for (const p of await this.riderRepo.find({ where: { userId: In(ids) } })) {
        profiles.set(p.userId, {
          name: fullName(p),
          ratingAvg: Number(p.ratingAvg ?? 0),
          ratingCount: p.ratingCount ?? 0,
        });
      }
    }

    const items = rows.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      profile: profiles.get(u.id) ?? null,
    }));
    return { items, total, page, limit };
  }

  /** A single user with their role profile + recent rides. */
  async getUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const rides = await this.rideRepo.find({
      where: [{ riderId: id }, { driverId: id }],
      order: { createdAt: 'DESC' },
      take: 20,
    });
    let profile: DriverProfile | RiderProfile | null = null;
    if (user.role === UserRole.DRIVER) {
      profile = await this.driverRepo.findOne({ where: { userId: id } });
    } else if (user.role === UserRole.RIDER) {
      profile = await this.riderRepo.findOne({ where: { userId: id } });
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        adminRole: user.adminRole ?? null,
        createdAt: user.createdAt,
      },
      profile,
      rides: rides.map(stripPin),
    };
  }

  /** Paginated ride history, filterable by status (PIN stripped). */
  async listRides(params: Page & { status?: RideStatus }) {
    const { status, page, limit } = params;
    const qb = this.rideRepo
      .createQueryBuilder('r')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (status) qb.andWhere('r.status = :status', { status });
    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map(stripPin), total, page, limit };
  }

  // ─── A2 · Live fleet ───────────────────────────────────────────────────────
  /** Online/on-trip drivers with their last GEO position + any active ride. */
  async fleet() {
    const positions = await this.matching.fleetPositions();
    const ids = positions.map((p) => p.driverId);
    const profiles = ids.length ? await this.drivers.findByUserIds(ids) : [];
    const byId = new Map(profiles.map((p) => [p.userId, p]));
    const activeRides = ids.length
      ? await this.rideRepo.find({ where: { driverId: In(ids), status: In(ACTIVE_DRIVING) } })
      : [];
    const rideByDriver = new Map(activeRides.map((r) => [r.driverId as string, r]));

    const drivers = positions.map((pos) => {
      const p = byId.get(pos.driverId);
      const ride = rideByDriver.get(pos.driverId) ?? null;
      return {
        driverId: pos.driverId,
        name: p ? fullName(p) : '—',
        lat: pos.lat,
        lng: pos.lng,
        availability: p?.availability ?? DriverAvailability.ONLINE,
        category: p?.vehicle?.category ?? null,
        rideId: ride?.id ?? null,
        rideStatus: ride?.status ?? null,
      };
    });
    return {
      drivers,
      counts: {
        total: drivers.length,
        online: drivers.filter((d) => d.availability === DriverAvailability.ONLINE).length,
        onTrip: drivers.filter((d) => d.availability === DriverAvailability.ON_TRIP).length,
      },
    };
  }

  // ─── A3 · Write actions ──────────────────────────────────────────────────────
  /** Suspend / reactivate a user account. */
  async setUserStatus(id: string, status: UserStatus) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');
    user.status = status;
    await this.userRepo.save(user);
    return { id: user.id, status: user.status };
  }

  /** Approve or reject a driver's KYC (NIN + liveness). Approval completes onboarding. */
  async verifyDriver(userId: string, approve: boolean) {
    const profile = await this.driverRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('driver profile not found');
    profile.ninStatus = approve ? KycStatus.VERIFIED : KycStatus.REJECTED;
    if (approve) {
      profile.livenessVerified = true;
      profile.onboardingComplete = true;
    }
    await this.driverRepo.save(profile);
    return {
      userId,
      ninStatus: profile.ninStatus,
      livenessVerified: profile.livenessVerified,
      onboardingComplete: profile.onboardingComplete,
    };
  }

  /** Admin override-cancel of any non-terminal ride (no penalty; both parties notified). */
  async cancelRide(rideId: string, reason?: string) {
    const ride = await this.rideRepo.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('ride not found');
    if (ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED) {
      throw new ConflictException(`cannot cancel a ${ride.status.toLowerCase()} ride`);
    }
    const driverId = ride.driverId;
    ride.status = RideStatus.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancelReason = reason ?? 'Cancelled by admin';
    await this.rideRepo.save(ride);
    if (driverId) await this.drivers.setAvailability(driverId, DriverAvailability.ONLINE);
    const payload = { rideId, reason: ride.cancelReason, byAdmin: true };
    this.realtime.emitToUser(ride.riderId, 'ride:cancelled', payload);
    if (driverId) this.realtime.emitToUser(driverId, 'ride:cancelled', payload);
    return stripPin(ride);
  }

  // ─── A6 · Financials ─────────────────────────────────────────────────────────
  /** Platform revenue (REVENUE wallet), GMV, payouts + top-ups. Amounts in naira. */
  async financeSummary() {
    const today = startOfToday();
    const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
    const gmvAll = await this.rideRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r."agreedPrice"), 0)', 'sum')
      .where('r.status = :s', { s: RideStatus.COMPLETED })
      .getRawOne<{ sum: string }>();
    const gmvToday = await this.rideRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r."agreedPrice"), 0)', 'sum')
      .where('r.status = :s', { s: RideStatus.COMPLETED })
      .andWhere('r."createdAt" >= :d', { d: today })
      .getRawOne<{ sum: string }>();
    const agg = async (type: TransactionType) =>
      this.txnRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'sum')
        .addSelect('COUNT(*)', 'count')
        .where('t.type = :type', { type })
        .andWhere('t.status = :st', { st: TransactionStatus.SUCCESS })
        .getRawOne<{ sum: string; count: string }>();
    const [payouts, topups] = await Promise.all([
      agg(TransactionType.RIDE_PAYOUT),
      agg(TransactionType.TOPUP),
    ]);

    return {
      revenue: revenue.balance / 100,
      gmvAllTime: Number(gmvAll?.sum ?? 0),
      gmvToday: Number(gmvToday?.sum ?? 0),
      payouts: Number(payouts?.sum ?? 0) / 100,
      payoutCount: Number(payouts?.count ?? 0),
      topups: Number(topups?.sum ?? 0) / 100,
      topupCount: Number(topups?.count ?? 0),
    };
  }

  /** Paginated payout transactions (money out to driver banks). */
  async payouts(params: Page) {
    const { page, limit } = params;
    const [rows, total] = await this.txnRepo.findAndCount({
      where: { type: TransactionType.RIDE_PAYOUT },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const items = rows.map((t) => ({
      id: t.id,
      reference: t.reference,
      amount: t.amount / 100,
      status: t.status,
      userId: t.userId,
      provider: t.provider,
      providerRef: t.providerRef,
      createdAt: t.createdAt,
    }));
    return { items, total, page, limit };
  }

  /** Current fare + commission configuration (read-only; sourced from env config). */
  fareConfig() {
    const { pricing, money } = this.config;
    return {
      pricing: {
        baseFare: pricing.baseFare,
        perKm: pricing.perKm,
        perMin: pricing.perMin,
        fuelIndex: pricing.fuelIndex,
      },
      commission: {
        commissionRateBps: money.commissionRateBps,
        commissionPct: money.commissionRateBps / 100,
      },
      cancellation: {
        cancellationFee: money.cancellationFee,
        cancellationGraceSeconds: money.cancellationGraceSeconds,
        penaltyDriverShareBps: money.penaltyDriverShareBps,
        driverCancelFee: money.driverCancelFee,
      },
      wallet: { minTopup: money.minTopup, minPayout: money.minPayout },
    };
  }

  // ─── A5 · Tickets ────────────────────────────────────────────────────────────
  listTickets(params: Page & { status?: TicketStatus }) {
    return this.tickets.list(params);
  }

  updateTicket(id: string, adminId: string, dto: UpdateTicketDto) {
    return this.tickets.update(id, adminId, dto);
  }

  // ─── A3 · Audit log ──────────────────────────────────────────────────────────
  listAudit(params: Page & { action?: string }) {
    return this.audit.list(params);
  }
}
