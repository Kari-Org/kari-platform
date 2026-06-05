import { Injectable } from '@nestjs/common';
import { LedgerService } from './ledger.service';

/** kobo → naira for display. Internal math stays in kobo. */
const toNaira = (kobo: number): number => kobo / 100;

/**
 * User-facing wallet reads (balance + transaction history). All writes go
 * through PaymentsService → LedgerService; this is read-only.
 */
@Injectable()
export class WalletService {
  constructor(private readonly ledger: LedgerService) {}

  async summary(userId: string) {
    const wallet = await this.ledger.getOrCreateUserWallet(userId);
    return {
      walletId: wallet.id,
      currency: wallet.currency,
      balanceKobo: wallet.balance,
      balance: toNaira(wallet.balance),
    };
  }

  async history(userId: string, limit = 50) {
    const wallet = await this.ledger.getOrCreateUserWallet(userId);
    const entries = await this.ledger.history(wallet.id, limit);
    return entries.map((e) => ({
      id: e.id,
      type: e.type,
      direction: e.direction,
      amountKobo: e.amount,
      amount: toNaira(e.amount),
      balanceAfterKobo: e.balanceAfter,
      balanceAfter: toNaira(e.balanceAfter),
      at: e.createdAt,
    }));
  }
}
