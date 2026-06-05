import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { BookShuttleDto } from './dto/book-shuttle.dto';
import { ShuttleService } from './shuttle.service';

@ApiTags('shuttle')
@ApiBearerAuth()
@Controller('shuttle')
export class ShuttleController {
  constructor(private readonly shuttle: ShuttleService) {}

  @Get('routes')
  @ApiOperation({ summary: 'Shuttle routes + ordered stops' })
  @ResponseMessage('Routes')
  routes() {
    return this.shuttle.listRoutes();
  }

  @Get('trips')
  @ApiOperation({ summary: 'Upcoming scheduled trips (optionally by routeId)' })
  @ResponseMessage('Trips')
  trips(@Query('routeId') routeId?: string) {
    return this.shuttle.listTrips(routeId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @Get('bookings/mine')
  @ApiOperation({ summary: 'My shuttle bookings' })
  @ResponseMessage('Bookings')
  mine(@CurrentUser('id') id: string) {
    return this.shuttle.myBookings(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(200)
  @Post('trips/:id/book')
  @ApiOperation({ summary: 'Book a seat between two stops (charged from wallet)' })
  @ResponseMessage('Seat booked')
  book(@CurrentUser('id') id: string, @Param('id') tripId: string, @Body() dto: BookShuttleDto) {
    return this.shuttle.book(id, tripId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(200)
  @Post('bookings/:id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (refunds the wallet, frees the seat)' })
  @ResponseMessage('Booking cancelled')
  cancel(@CurrentUser('id') id: string, @Param('id') bookingId: string) {
    return this.shuttle.cancel(id, bookingId);
  }
}
