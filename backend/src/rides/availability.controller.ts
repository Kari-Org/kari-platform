import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { DriverLocationDto } from './dto/driver-location.dto';
import { MatchingService } from './matching.service';

@ApiTags('availability')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.DRIVER)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly matching: MatchingService) {}

  @HttpCode(200)
  @Post('online')
  @ApiOperation({ summary: 'Go online at a location (enter the matching pool)' })
  @ResponseMessage('Online')
  async online(@CurrentUser('id') id: string, @Body() dto: DriverLocationDto) {
    await this.matching.setOnline(id, dto.lat, dto.lng);
    return { availability: 'ONLINE' };
  }

  @HttpCode(200)
  @Post('location')
  @ApiOperation({ summary: 'Update my live location' })
  @ResponseMessage('Location updated')
  async location(@CurrentUser('id') id: string, @Body() dto: DriverLocationDto) {
    await this.matching.updateLocation(id, dto.lat, dto.lng);
    return { ok: true };
  }

  @HttpCode(200)
  @Post('offline')
  @ApiOperation({ summary: 'Go offline (leave the matching pool)' })
  @ResponseMessage('Offline')
  async offline(@CurrentUser('id') id: string) {
    await this.matching.setOffline(id);
    return { availability: 'OFFLINE' };
  }
}
