import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { SubscribeDto } from './dto/subscribe.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Available subscription plans' })
  @ResponseMessage('Plans')
  plans() {
    return this.subscriptions.listPlans();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(200)
  @Post()
  @ApiOperation({ summary: 'Subscribe to a plan (charges the fee from your wallet)' })
  @ResponseMessage('Subscribed')
  subscribe(@CurrentUser('id') id: string, @Body() dto: SubscribeDto) {
    return this.subscriptions.subscribe(id, dto.planId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @Get('mine')
  @ApiOperation({ summary: 'My subscriptions' })
  @ResponseMessage('Subscriptions')
  mine(@CurrentUser('id') id: string) {
    return this.subscriptions.mine(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(200)
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active subscription' })
  @ResponseMessage('Subscription cancelled')
  cancel(@CurrentUser('id') id: string, @Param('id') subId: string) {
    return this.subscriptions.cancel(id, subId);
  }
}
