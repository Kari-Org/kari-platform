import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentMethod, UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CancelRideDto } from './dto/cancel-ride.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { QuoteDto } from './dto/quote.dto';
import { RateRideDto } from './dto/rate-ride.dto';
import { RequestRideDto } from './dto/request-ride.dto';
import { StartRideDto } from './dto/start-ride.dto';
import { TipRideDto } from './dto/tip-ride.dto';
import { RidesService } from './rides.service';

@ApiTags('rides')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('rides')
export class RidesController {
  constructor(private readonly rides: RidesService) {}

  @HttpCode(200)
  @Roles(UserRole.RIDER)
  @Post('quote')
  @ApiOperation({ summary: 'Get a tiered fare quote (cached 15 min)' })
  @ResponseMessage('Quote')
  quote(@Body() dto: QuoteDto) {
    return this.rides.quote(dto);
  }

  @Roles(UserRole.RIDER)
  @Post()
  @ApiOperation({ summary: 'Request a ride against a quote; dispatches to nearby drivers' })
  @ResponseMessage('Ride requested')
  request(@CurrentUser('id') id: string, @Body() dto: RequestRideDto) {
    return this.rides.request(id, dto);
  }

  // `mine` declared before `:id` so it isn't captured by the param route.
  @Get('mine')
  @ApiOperation({ summary: 'List my rides' })
  @ResponseMessage('Rides')
  mine(@CurrentUser('id') id: string) {
    return this.rides.getMine(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ride I participate in' })
  @ResponseMessage('Ride')
  one(@CurrentUser('id') id: string, @Param('id') rideId: string) {
    return this.rides.getOne(id, rideId);
  }

  @HttpCode(200)
  @Roles(UserRole.DRIVER)
  @Post(':id/accept')
  @ApiOperation({ summary: 'Driver accepts a standard ride (first-wins, optimistic-locked)' })
  @ResponseMessage('Ride accepted')
  accept(@CurrentUser('id') id: string, @Param('id') rideId: string) {
    return this.rides.accept(id, rideId);
  }

  @HttpCode(200)
  @Roles(UserRole.DRIVER)
  @Post(':id/offer')
  @ApiOperation({ summary: 'Driver counter-offers on a negotiable ride (≤ standard fare)' })
  @ResponseMessage('Offer submitted')
  offer(@CurrentUser('id') id: string, @Param('id') rideId: string, @Body() dto: CounterOfferDto) {
    return this.rides.makeOffer(id, rideId, dto.amount);
  }

  @HttpCode(200)
  @Roles(UserRole.RIDER)
  @Post(':id/offers/:offerId/accept')
  @ApiOperation({ summary: 'Rider accepts a specific driver offer' })
  @ResponseMessage('Offer accepted')
  acceptOffer(
    @CurrentUser('id') id: string,
    @Param('id') rideId: string,
    @Param('offerId') offerId: string,
  ) {
    return this.rides.acceptOffer(id, rideId, offerId);
  }

  @HttpCode(200)
  @Roles(UserRole.DRIVER)
  @Post(':id/arrived')
  @ApiOperation({ summary: 'Driver marks arrival at pickup' })
  @ResponseMessage('Marked arrived')
  arrived(@CurrentUser('id') id: string, @Param('id') rideId: string) {
    return this.rides.arrived(id, rideId);
  }

  @HttpCode(200)
  @Roles(UserRole.DRIVER)
  @Post(':id/start')
  @ApiOperation({ summary: 'Driver starts the ride with the rider PIN' })
  @ResponseMessage('Ride started')
  start(@CurrentUser('id') id: string, @Param('id') rideId: string, @Body() dto: StartRideDto) {
    return this.rides.start(id, rideId, dto.otp);
  }

  @HttpCode(200)
  @Roles(UserRole.DRIVER)
  @Post(':id/complete')
  @ApiOperation({ summary: 'Driver completes the ride' })
  @ResponseMessage('Ride completed')
  complete(@CurrentUser('id') id: string, @Param('id') rideId: string) {
    return this.rides.complete(id, rideId);
  }

  @HttpCode(200)
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a ride (rider or driver)' })
  @ResponseMessage('Ride cancelled')
  cancel(@CurrentUser() user: AuthUser, @Param('id') rideId: string, @Body() dto: CancelRideDto) {
    return this.rides.cancel(user.id, user.role, rideId, dto);
  }

  @HttpCode(200)
  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate a completed ride (rider or driver)' })
  @ResponseMessage('Rating saved')
  rate(@CurrentUser() user: AuthUser, @Param('id') rideId: string, @Body() dto: RateRideDto) {
    return this.rides.rate(user.id, user.role, rideId, dto);
  }

  @HttpCode(200)
  @Roles(UserRole.RIDER)
  @Post(':id/tip')
  @ApiOperation({ summary: 'Tip the driver after a completed ride' })
  @ResponseMessage('Tip sent')
  tip(@CurrentUser('id') id: string, @Param('id') rideId: string, @Body() dto: TipRideDto) {
    return this.rides.tip(id, rideId, dto.amount, dto.method ?? PaymentMethod.WALLET);
  }
}
