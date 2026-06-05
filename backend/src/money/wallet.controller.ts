import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { PayoutDto } from './dto/payout.dto';
import { TopupDto } from './dto/topup.dto';
import { PaymentsService } from './payments.service';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly payments: PaymentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'My wallet balance' })
  @ResponseMessage('Wallet')
  balance(@CurrentUser('id') id: string) {
    return this.wallet.summary(id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'My wallet transaction history' })
  @ResponseMessage('Transactions')
  transactions(@CurrentUser('id') id: string) {
    return this.wallet.history(id);
  }

  @HttpCode(200)
  @Post('topup')
  @ApiOperation({ summary: 'Start a wallet top-up (returns a gateway authorization URL)' })
  @ResponseMessage('Top-up initiated')
  topup(@CurrentUser('id') id: string, @Body() dto: TopupDto) {
    return this.payments.initiateTopup(id, dto.amount);
  }

  @HttpCode(200)
  @Post('topup/:reference/verify')
  @ApiOperation({ summary: 'Verify a top-up with the gateway and credit the wallet' })
  @ResponseMessage('Top-up verified')
  verify(@Param('reference') reference: string) {
    return this.payments.confirmTopup(reference);
  }

  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @Post('payout')
  @ApiOperation({ summary: 'Withdraw wallet funds to the driver bank account' })
  @ResponseMessage('Payout requested')
  payout(@CurrentUser('id') id: string, @Body() dto: PayoutDto) {
    return this.payments.requestPayout(id, dto.amount);
  }
}
