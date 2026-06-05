import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverModule } from '../driver/driver.module';
import { UsersModule } from '../users/users.module';
import { CommissionService } from './commission.service';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from './entities/wallet.entity';
import { LedgerService } from './ledger.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

/**
 * Phase 3 — Money. Double-entry wallet/ledger, Paystack-backed top-ups & payouts,
 * commission engine, and cancellation penalties. PaymentsService is exported so
 * RidesModule can settle fares on completion and apply cancellation penalties.
 * The PaymentProvider + APP_CONFIG come from the global Providers/Config modules.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction, LedgerEntry]),
    UsersModule,
    DriverModule,
  ],
  controllers: [WalletController, PaymentsController],
  providers: [LedgerService, CommissionService, WalletService, PaymentsService],
  exports: [PaymentsService, LedgerService],
})
export class MoneyModule {}
