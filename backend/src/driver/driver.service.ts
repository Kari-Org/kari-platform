import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DriverAvailability, DriverType } from '@kari/types';
import { DriverProfile } from './entities/driver-profile.entity';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverProfile) private readonly profiles: Repository<DriverProfile>,
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
  ) {}

  async getOrCreate(userId: string): Promise<DriverProfile> {
    const existing = await this.profiles.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    return this.profiles.save(this.profiles.create({ userId }));
  }

  findByUser(userId: string): Promise<DriverProfile | null> {
    return this.profiles.findOne({ where: { userId } });
  }

  save(profile: DriverProfile): Promise<DriverProfile> {
    return this.profiles.save(profile);
  }

  buildVehicle(data: Partial<Vehicle>): Vehicle {
    return this.vehicles.create(data);
  }

  list(): Promise<DriverProfile[]> {
    return this.profiles.find();
  }

  async setAvailability(userId: string, availability: DriverAvailability): Promise<void> {
    await this.profiles.update({ userId }, { availability });
  }

  /** Carpool opt-in — freelance only; dedicated drivers never serve carpools (spec 0001). */
  async setCarpoolMode(userId: string, enabled: boolean): Promise<boolean> {
    const profile = await this.getOrCreate(userId);
    if (profile.driverType !== DriverType.FREELANCE) {
      throw new ForbiddenException('Carpool mode is only available to freelance drivers');
    }
    profile.carpoolMode = enabled;
    await this.profiles.save(profile);
    return profile.carpoolMode;
  }

  /** Loads profiles (with vehicle, eager) for a set of user ids — used by matching. */
  findByUserIds(userIds: string[]): Promise<DriverProfile[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.profiles.find({ where: { userId: In(userIds) } });
  }

  async addRating(userId: string, stars: number): Promise<void> {
    const p = await this.getOrCreate(userId);
    const total = p.ratingAvg * p.ratingCount + stars;
    p.ratingCount += 1;
    p.ratingAvg = total / p.ratingCount;
    await this.profiles.save(p);
  }
}
