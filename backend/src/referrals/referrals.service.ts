import { randomInt } from 'node:crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerDirection, SystemAccount, TransactionType } from '@kari/types';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import { LedgerService } from '../money/ledger.service';
import { User } from '../users/entities/user.entity';

// No ambiguous characters (no 0/O/1/I).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 7;

/**
 * Referral loop: each user gets a unique shareable code; a new user applies a
 * code to record who referred them; on the referee's first completed ride both
 * sides are rewarded once (a REVENUE-funded ledger credit). Idempotent via the
 * `referralRewarded` flag and a per-referee transaction reference.
 */
@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly ledger: LedgerService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private generate(): string {
    let s = '';
    for (let i = 0; i < CODE_LENGTH; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    return s;
  }

  /** Returns the user's referral code, generating + persisting one on first call. */
  async ensureCode(userId: string): Promise<string> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('user not found');
    if (user.referralCode) return user.referralCode;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.generate();
      try {
        await this.users.update(user.id, { referralCode: code });
        return code;
      } catch {
        // unique collision — try another
      }
    }
    throw new BadRequestException('could not allocate a referral code, try again');
  }

  /** Record that `userId` was referred by the owner of `code`. One-time. */
  async apply(userId: string, code: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('user not found');
    if (user.referredByUserId) throw new BadRequestException('you have already used a referral code');
    const referrer = await this.users.findOne({ where: { referralCode: code.trim().toUpperCase() } });
    if (!referrer) throw new BadRequestException('invalid referral code');
    if (referrer.id === userId) throw new BadRequestException('you cannot use your own referral code');
    await this.users.update(user.id, { referredByUserId: referrer.id });
    return { applied: true, rewardOnFirstRide: this.config.engagement.referralReward };
  }

  /**
   * Called when a referred user completes a ride: pay both sides once. Returns
   * true if a reward was posted. Safe to call on every completion.
   */
  async rewardForFirstRide(refereeId: string): Promise<boolean> {
    const user = await this.users.findOne({ where: { id: refereeId } });
    if (!user || !user.referredByUserId || user.referralRewarded) return false;

    const rewardNaira = this.config.engagement.referralReward;
    if (rewardNaira <= 0) {
      await this.users.update(user.id, { referralRewarded: true });
      return false;
    }
    const rewardKobo = rewardNaira * 100;
    const referee = await this.ledger.getOrCreateUserWallet(user.id);
    const referrer = await this.ledger.getOrCreateUserWallet(user.referredByUserId);
    const revenue = await this.ledger.systemWallet(SystemAccount.REVENUE);
    await this.ledger.post({
      type: TransactionType.REFERRAL,
      reference: `referral_${user.id}`,
      amount: rewardKobo * 2,
      legs: [
        { walletId: revenue.id, direction: LedgerDirection.DEBIT, amount: rewardKobo * 2 },
        { walletId: referrer.id, direction: LedgerDirection.CREDIT, amount: rewardKobo },
        { walletId: referee.id, direction: LedgerDirection.CREDIT, amount: rewardKobo },
      ],
      userId: user.id,
      metadata: { referrerId: user.referredByUserId, rewardNaira },
    });
    await this.users.update(user.id, { referralRewarded: true });
    return true;
  }

  async getMine(userId: string) {
    const code = await this.ensureCode(userId);
    const user = await this.users.findOne({ where: { id: userId } });
    const referralsCount = await this.users.count({ where: { referredByUserId: userId } });
    return {
      code,
      referredBy: user?.referredByUserId ?? null,
      rewarded: user?.referralRewarded ?? false,
      referralsCount,
      rewardNaira: this.config.engagement.referralReward,
    };
  }
}
