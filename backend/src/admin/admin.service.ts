import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { CarCategory, DriverAvailability, DriverType, RideStatus, UserRole } from '@kari/types';
import { PasswordService } from '../auth/services/password.service';
import { DriverService } from '../driver/driver.service';
import { DriverProfile } from '../driver/entities/driver-profile.entity';
import { RiderProfile } from '../rider/entities/rider-profile.entity';
import { Ride } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import type { CreateDedicatedDriverDto } from './dto/create-dedicated-driver.dto';

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
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(RiderProfile) private readonly riderRepo: Repository<RiderProfile>,
    @InjectRepository(DriverProfile) private readonly driverRepo: Repository<DriverProfile>,
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
}
