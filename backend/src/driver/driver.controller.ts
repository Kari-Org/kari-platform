import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { NinDto } from '../identity/dto/nin.dto';
import { DriverOnboardingService } from './driver-onboarding.service';
import { DriverService } from './driver.service';
import { DriverDetailsDto } from './dto/driver-details.dto';
import { DriverPersonalDto } from './dto/driver-personal.dto';
import { DriverQuizDto } from './dto/driver-quiz.dto';
import { LivenessCheckDto } from './dto/liveness-check.dto';
import { VehicleDto } from './dto/vehicle.dto';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.DRIVER)
@Controller('drivers')
export class DriverController {
  constructor(
    private readonly drivers: DriverService,
    private readonly onboarding: DriverOnboardingService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my driver profile' })
  @ResponseMessage('Driver profile')
  me(@CurrentUser('id') id: string) {
    return this.drivers.getOrCreate(id);
  }

  @Post('onboarding/personal')
  @ApiOperation({ summary: 'Step 1 — personal info' })
  @ResponseMessage('Personal info saved')
  personal(@CurrentUser('id') id: string, @Body() dto: DriverPersonalDto) {
    return this.onboarding.setPersonal(id, dto);
  }

  @HttpCode(200)
  @Post('onboarding/quiz')
  @ApiOperation({ summary: 'Step 2 — personality quiz' })
  @ResponseMessage('Personality profiled')
  quiz(@CurrentUser('id') id: string, @Body() dto: DriverQuizDto) {
    return this.onboarding.setPersonality(id, dto.answers);
  }

  @Post('onboarding/vehicle')
  @ApiOperation({ summary: 'Step 3 — vehicle details' })
  @ResponseMessage('Vehicle saved')
  vehicle(@CurrentUser('id') id: string, @Body() dto: VehicleDto) {
    return this.onboarding.setVehicle(id, dto);
  }

  @Post('onboarding/details')
  @ApiOperation({ summary: 'Step 4 — payout + next of kin' })
  @ResponseMessage('Details saved')
  details(@CurrentUser('id') id: string, @Body() dto: DriverDetailsDto) {
    return this.onboarding.setDetails(id, dto);
  }

  @HttpCode(200)
  @Post('onboarding/nin')
  @ApiOperation({ summary: 'Verify NIN (KYC gate)' })
  @ResponseMessage('NIN checked')
  nin(@CurrentUser('id') id: string, @Body() dto: NinDto) {
    return this.onboarding.verifyNin(id, dto.nin);
  }

  @HttpCode(200)
  @Post('onboarding/liveness/session')
  @ApiOperation({ summary: 'Start a face-liveness session' })
  @ResponseMessage('Liveness session created')
  livenessSession() {
    return this.onboarding.startLiveness();
  }

  @HttpCode(200)
  @Post('onboarding/liveness/check')
  @ApiOperation({ summary: 'Check the liveness result (KYC gate)' })
  @ResponseMessage('Liveness checked')
  livenessCheck(@CurrentUser('id') id: string, @Body() dto: LivenessCheckDto) {
    return this.onboarding.checkLiveness(id, dto.sessionId);
  }

  @HttpCode(200)
  @Post('onboarding/complete')
  @ApiOperation({ summary: 'Complete onboarding — gated on personal info, vehicle, payout, NIN, liveness' })
  @ResponseMessage('Onboarding complete')
  complete(@CurrentUser('id') id: string) {
    return this.onboarding.complete(id);
  }
}
