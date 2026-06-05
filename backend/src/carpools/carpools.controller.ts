import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CarpoolsService } from './carpools.service';
import { CreateCarpoolDto } from './dto/create-carpool.dto';

@ApiTags('carpools')
@ApiBearerAuth()
@Controller('carpools')
export class CarpoolsController {
  constructor(private readonly carpools: CarpoolsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(200)
  @Post()
  @ApiOperation({ summary: 'Create a carpool from a quote (NIN-verified riders only)' })
  @ResponseMessage('Carpool created')
  create(@CurrentUser('id') id: string, @Body() dto: CreateCarpoolDto) {
    return this.carpools.create(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @Get()
  @ApiOperation({ summary: 'Joinable carpools near a point (lat/lng)' })
  @ResponseMessage('Carpools')
  list(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.carpools.listJoinable(Number(lat), Number(lng));
  }

  @Get('mine')
  @ApiOperation({ summary: 'My carpools' })
  @ResponseMessage('Carpools')
  mine(@CurrentUser('id') id: string) {
    return this.carpools.mine(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a carpool' })
  @ResponseMessage('Carpool')
  one(@Param('id') id: string) {
    return this.carpools.getOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(200)
  @Post(':id/join')
  @ApiOperation({ summary: 'Join a carpool (NIN-verified; optimistic seat claim)' })
  @ResponseMessage('Joined carpool')
  join(@CurrentUser('id') id: string, @Param('id') carpoolId: string) {
    return this.carpools.join(id, carpoolId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @HttpCode(200)
  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a carpool' })
  @ResponseMessage('Left carpool')
  leave(@CurrentUser('id') id: string, @Param('id') carpoolId: string) {
    return this.carpools.leave(id, carpoolId);
  }

  @HttpCode(200)
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a carpool (creator or driver)' })
  @ResponseMessage('Carpool cancelled')
  cancel(@CurrentUser('id') id: string, @Param('id') carpoolId: string) {
    return this.carpools.cancel(id, carpoolId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @HttpCode(200)
  @Post(':id/accept')
  @ApiOperation({ summary: 'Driver accepts a carpool' })
  @ResponseMessage('Carpool accepted')
  accept(@CurrentUser('id') id: string, @Param('id') carpoolId: string) {
    return this.carpools.accept(id, carpoolId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  @HttpCode(200)
  @Post(':id/complete')
  @ApiOperation({ summary: 'Driver completes a carpool (settles all member shares)' })
  @ResponseMessage('Carpool completed')
  complete(@CurrentUser('id') id: string, @Param('id') carpoolId: string) {
    return this.carpools.complete(id, carpoolId);
  }
}
