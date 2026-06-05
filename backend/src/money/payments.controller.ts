import { Controller, Get, Headers, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @Get('earnings')
  @ApiOperation({ summary: 'Driver earnings summary (gross, commission, payouts, balance)' })
  @ResponseMessage('Earnings')
  earnings(@CurrentUser('id') id: string) {
    return this.payments.earnings(id);
  }

  @Public()
  @HttpCode(200)
  @Post('webhook')
  @ApiExcludeEndpoint()
  webhook(
    @Req() req: { rawBody?: Buffer; body?: unknown },
    @Headers('x-paystack-signature') signature?: string,
  ) {
    // Paystack signs the raw bytes; fall back to a re-serialised body for the
    // no-op dev provider (which accepts any signature anyway).
    const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    return this.payments.handleWebhook(raw, signature ?? '');
  }
}
