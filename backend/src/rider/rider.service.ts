import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycStatus } from '@kari/types';
import { IdentityService } from '../identity/identity.service';
import type { RiderPreferencesDto } from './dto/rider-preferences.dto';
import type { RiderProfileDto } from './dto/rider-profile.dto';
import type { SavedAddressDto } from './dto/saved-address.dto';
import { RiderProfile } from './entities/rider-profile.entity';
import { SavedAddress } from './entities/saved-address.entity';

@Injectable()
export class RiderService {
  constructor(
    @InjectRepository(RiderProfile) private readonly profiles: Repository<RiderProfile>,
    @InjectRepository(SavedAddress) private readonly addresses: Repository<SavedAddress>,
    private readonly identity: IdentityService,
  ) {}

  async getOrCreate(userId: string): Promise<RiderProfile> {
    const existing = await this.profiles.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    return this.profiles.save(this.profiles.create({ userId }));
  }

  async setProfile(userId: string, dto: RiderProfileDto): Promise<RiderProfile> {
    const p = await this.getOrCreate(userId);
    p.firstName = dto.firstName;
    p.lastName = dto.lastName;
    if (dto.preferredDriverBehavior) {
      p.preferredDriverBehavior = dto.preferredDriverBehavior;
    }
    if (dto.gender !== undefined) {
      p.gender = dto.gender;
    }
    if (dto.referralCode !== undefined) {
      p.referralCode = dto.referralCode;
    }
    return this.profiles.save(p);
  }

  async setPreferences(userId: string, dto: RiderPreferencesDto): Promise<RiderProfile> {
    const p = await this.getOrCreate(userId);
    if (dto.preferredDriverBehavior !== undefined) {
      p.preferredDriverBehavior = dto.preferredDriverBehavior;
    }
    if (dto.musicPreference !== undefined) {
      p.musicPreference = dto.musicPreference;
    }
    if (dto.accessibilityNeed !== undefined) {
      p.accessibilityNeed = dto.accessibilityNeed;
    }
    if (dto.promotionsOptIn !== undefined) {
      p.promotionsOptIn = dto.promotionsOptIn;
    }
    if (dto.homeAddress !== undefined) {
      p.homeAddress = dto.homeAddress;
    }
    return this.profiles.save(p);
  }

  async submitLiveness(userId: string, image: string): Promise<{ verified: boolean }> {
    const result = await this.identity.verifySelfie(image);
    const p = await this.getOrCreate(userId);
    p.livenessVerified = result.isLive;
    await this.profiles.save(p);
    return { verified: result.isLive };
  }

  async addAddress(userId: string, dto: SavedAddressDto): Promise<SavedAddress> {
    const p = await this.getOrCreate(userId);
    return this.addresses.save(this.addresses.create({ ...dto, rider: p }));
  }

  async listAddresses(userId: string): Promise<SavedAddress[]> {
    const p = await this.getOrCreate(userId);
    return this.addresses.find({ where: { rider: { id: p.id } } });
  }

  async verifyNin(userId: string, nin: string): Promise<{ verified: boolean; status: KycStatus }> {
    const result = await this.identity.verifyNin(nin);
    const p = await this.getOrCreate(userId);
    p.nin = nin;
    p.ninStatus = result.verified ? KycStatus.VERIFIED : KycStatus.REJECTED;
    await this.profiles.save(p);
    return { verified: result.verified, status: p.ninStatus };
  }

  async addRating(userId: string, stars: number): Promise<void> {
    const p = await this.getOrCreate(userId);
    const total = p.ratingAvg * p.ratingCount + stars;
    p.ratingCount += 1;
    p.ratingAvg = total / p.ratingCount;
    await this.profiles.save(p);
  }
}
