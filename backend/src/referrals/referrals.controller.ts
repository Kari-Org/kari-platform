import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { ApplyReferralDto } from './dto/apply-referral.dto';
import { ReferralsService } from './referrals.service';

@ApiTags('referrals')
@ApiBearerAuth()
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get('me')
  @ApiOperation({ summary: 'My referral code + stats' })
  @ResponseMessage('Referral')
  me(@CurrentUser('id') id: string) {
    return this.referrals.getMine(id);
  }

  @HttpCode(200)
  @Post('apply')
  @ApiOperation({ summary: "Apply a referrer's code (one-time, before your first ride)" })
  @ResponseMessage('Referral applied')
  apply(@CurrentUser('id') id: string, @Body() dto: ApplyReferralDto) {
    return this.referrals.apply(id, dto.code);
  }
}
