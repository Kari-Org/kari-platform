import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatus, type UserRole } from '@kari/types';
import { User } from './entities/user.entity';

export interface CreatePendingInput {
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.repo.findOne({ where: { phone } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  /** Matches a user whose email OR phone equals the given values. */
  findByEmailOrPhone(email: string, phone: string): Promise<User | null> {
    return this.repo.findOne({ where: [{ email }, { phone }] });
  }

  createPending(input: CreatePendingInput): Promise<User> {
    const user = this.repo.create({ ...input, status: UserStatus.PENDING_VERIFICATION });
    return this.repo.save(user);
  }

  /** Creates an already-active, pre-verified user (admin-managed accounts). */
  createActive(input: CreatePendingInput): Promise<User> {
    const user = this.repo.create({
      ...input,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
    });
    return this.repo.save(user);
  }

  async markPhoneVerifiedAndActivate(id: string): Promise<void> {
    await this.repo.update(id, { phoneVerified: true, status: UserStatus.ACTIVE });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.repo.update(id, { passwordHash });
  }
}
