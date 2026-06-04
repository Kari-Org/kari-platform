import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { NinDto } from '../identity/dto/nin.dto';
import { RiderLivenessDto } from './dto/liveness.dto';
import { RiderPreferencesDto } from './dto/rider-preferences.dto';
import { RiderProfileDto } from './dto/rider-profile.dto';
import { SavedAddressDto } from './dto/saved-address.dto';
import { RiderService } from './rider.service';

@ApiTags('riders')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.RIDER)
@Controller('riders')
export class RiderController {
  constructor(private readonly riders: RiderService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my rider profile' })
  @ResponseMessage('Rider profile')
  me(@CurrentUser('id') id: string) {
    return this.riders.getOrCreate(id);
  }

  @Post('onboarding/profile')
  @ApiOperation({ summary: 'Set name + preferred driver behavior' })
  @ResponseMessage('Profile saved')
  profile(@CurrentUser('id') id: string, @Body() dto: RiderProfileDto) {
    return this.riders.setProfile(id, dto);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Add a saved address (home/work/other)' })
  @ResponseMessage('Address saved')
  addAddress(@CurrentUser('id') id: string, @Body() dto: SavedAddressDto) {
    return this.riders.addAddress(id, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List my saved addresses' })
  @ResponseMessage('Saved addresses')
  listAddresses(@CurrentUser('id') id: string) {
    return this.riders.listAddresses(id);
  }

  @HttpCode(200)
  @Post('nin')
  @ApiOperation({ summary: 'Verify NIN (required for carpooling)' })
  @ResponseMessage('NIN checked')
  nin(@CurrentUser('id') id: string, @Body() dto: NinDto) {
    return this.riders.verifyNin(id, dto.nin);
  }

  @Post('onboarding/preferences')
  @ApiOperation({ summary: 'Save ride preferences (driver vibe, music, accessibility, promos)' })
  @ResponseMessage('Preferences saved')
  preferences(@CurrentUser('id') id: string, @Body() dto: RiderPreferencesDto) {
    return this.riders.setPreferences(id, dto);
  }

  @HttpCode(200)
  @Post('liveness')
  @ApiOperation({ summary: 'Submit a selfie for liveness verification' })
  @ResponseMessage('Liveness checked')
  liveness(@CurrentUser('id') id: string, @Body() dto: RiderLivenessDto) {
    return this.riders.submitLiveness(id, dto.image);
  }
}
