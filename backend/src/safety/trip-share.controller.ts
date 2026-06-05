import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { SafetyService } from './safety.service';

@ApiTags('safety')
@ApiBearerAuth()
@Controller('rides')
export class TripShareController {
  constructor(private readonly safety: SafetyService) {}

  @HttpCode(200)
  @Post(':id/share')
  @ApiOperation({ summary: 'Create a public share link for a ride' })
  @ResponseMessage('Trip share link created')
  share(@CurrentUser('id') id: string, @Param('id') rideId: string) {
    return this.safety.share(id, rideId);
  }

  @HttpCode(200)
  @Post(':id/share/stop')
  @ApiOperation({ summary: 'Revoke a ride’s share links' })
  @ResponseMessage('Trip sharing stopped')
  stop(@CurrentUser('id') id: string, @Param('id') rideId: string) {
    return this.safety.stopShare(id, rideId);
  }
}

@ApiTags('safety')
@Controller('trips')
export class SharedTripController {
  constructor(private readonly safety: SafetyService) {}

  @Public()
  @Get('shared/:token')
  @ApiOperation({ summary: 'Public read-only view of a shared trip (no auth)' })
  @ResponseMessage('Shared trip')
  resolve(@Param('token') token: string) {
    return this.safety.resolveShared(token);
  }
}
