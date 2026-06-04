import { BadRequestException, Injectable } from '@nestjs/common';
import { CarCategory, KycStatus, Personality } from '@kari/types';
import { IdentityService } from '../identity/identity.service';
import { DriverService } from './driver.service';
import type { DriverProfile } from './entities/driver-profile.entity';
import type { DriverDetailsDto } from './dto/driver-details.dto';
import type { DriverPersonalDto } from './dto/driver-personal.dto';
import type { VehicleDto } from './dto/vehicle.dto';

/** Averages quiz answers (1–5 Likert; higher = more talkative) into a bucket. */
function scorePersonality(answers: number[]): Personality {
  const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
  if (avg < 2.34) return Personality.RESERVED;
  if (avg < 3.67) return Personality.NEUTRAL;
  return Personality.TALKATIVE;
}

/** Orchestrates the freelance driver's multi-step, KYC-gated onboarding. */
@Injectable()
export class DriverOnboardingService {
  constructor(
    private readonly drivers: DriverService,
    private readonly identity: IdentityService,
  ) {}

  async setPersonal(userId: string, dto: DriverPersonalDto): Promise<DriverProfile> {
    const p = await this.drivers.getOrCreate(userId);
    p.firstName = dto.firstName;
    p.lastName = dto.lastName;
    p.dateOfBirth = dto.dateOfBirth;
    p.origin = dto.origin;
    return this.drivers.save(p);
  }

  async setPersonality(userId: string, answers: number[]): Promise<{ personality: Personality }> {
    const personality = scorePersonality(answers);
    const p = await this.drivers.getOrCreate(userId);
    p.personality = personality;
    await this.drivers.save(p);
    return { personality };
  }

  async setVehicle(userId: string, dto: VehicleDto): Promise<DriverProfile> {
    const p = await this.drivers.getOrCreate(userId);
    const data = {
      brand: dto.brand ?? null,
      model: dto.model,
      year: dto.year ?? null,
      plateNumber: dto.plateNumber,
      color: dto.color ?? null,
      category: dto.category ?? CarCategory.ECONOMY,
    };
    if (p.vehicle) {
      Object.assign(p.vehicle, data);
    } else {
      p.vehicle = this.drivers.buildVehicle(data);
    }
    return this.drivers.save(p);
  }

  async setDetails(userId: string, dto: DriverDetailsDto): Promise<DriverProfile> {
    const p = await this.drivers.getOrCreate(userId);
    p.bankAccountNumber = dto.bankAccountNumber;
    p.bankName = dto.bankName;
    p.bankAccountName = dto.bankAccountName;
    p.nokName = dto.nokName;
    p.nokPhone = dto.nokPhone;
    p.nokRelationship = dto.nokRelationship;
    if (dto.spotifyInstalled !== undefined) {
      p.spotifyInstalled = dto.spotifyInstalled;
    }
    if (dto.appleMusicInstalled !== undefined) {
      p.appleMusicInstalled = dto.appleMusicInstalled;
    }
    return this.drivers.save(p);
  }

  async verifyNin(userId: string, nin: string): Promise<{ verified: boolean; status: KycStatus }> {
    const result = await this.identity.verifyNin(nin);
    const p = await this.drivers.getOrCreate(userId);
    p.nin = nin;
    p.ninStatus = result.verified ? KycStatus.VERIFIED : KycStatus.REJECTED;
    await this.drivers.save(p);
    return { verified: result.verified, status: p.ninStatus };
  }

  startLiveness() {
    return this.identity.createLivenessSession();
  }

  async checkLiveness(userId: string, sessionId: string) {
    const result = await this.identity.checkLiveness(sessionId);
    const p = await this.drivers.getOrCreate(userId);
    p.livenessVerified = result.isLive;
    await this.drivers.save(p);
    return result;
  }

  async complete(userId: string): Promise<DriverProfile> {
    const p = await this.drivers.getOrCreate(userId);
    const missing: string[] = [];
    if (!p.firstName || !p.lastName || !p.dateOfBirth || !p.origin) {
      missing.push('personal info');
    }
    if (!p.vehicle) {
      missing.push('vehicle');
    }
    if (!p.bankAccountNumber) {
      missing.push('payment details');
    }
    if (p.ninStatus !== KycStatus.VERIFIED) {
      missing.push('NIN verification');
    }
    if (!p.livenessVerified) {
      missing.push('liveness check');
    }
    if (missing.length > 0) {
      throw new BadRequestException(`onboarding incomplete: ${missing.join(', ')}`);
    }
    p.onboardingComplete = true;
    return this.drivers.save(p);
  }
}
