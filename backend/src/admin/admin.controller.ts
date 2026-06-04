import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RideStatus, UserRole } from '@kari/types';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AdminService } from './admin.service';
import { CreateDedicatedDriverDto } from './dto/create-dedicated-driver.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @RequirePermissions('dashboard:view')
  @ApiOperation({ summary: 'Dashboard KPIs' })
  @ResponseMessage('Stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  @RequirePermissions('riders:read')
  @ApiOperation({ summary: 'List users (filter by role + search), paginated' })
  @ResponseMessage('Users')
  listUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listUsers({
      role: role ? (role as UserRole) : undefined,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('users/:id')
  @RequirePermissions('riders:read')
  @ApiOperation({ summary: 'A user with their profile + recent rides' })
  @ResponseMessage('User')
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Get('rides')
  @RequirePermissions('trips:read')
  @ApiOperation({ summary: 'Ride history (filter by status), paginated' })
  @ResponseMessage('Rides')
  listRides(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listRides({
      status: status ? (status as RideStatus) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('drivers/dedicated')
  @RequirePermissions('dedicated:onboard')
  @ApiOperation({ summary: 'Onboard a dedicated (salaried) driver' })
  @ResponseMessage('Dedicated driver created')
  createDedicated(@Body() dto: CreateDedicatedDriverDto) {
    return this.admin.createDedicatedDriver(dto);
  }

  @Get('drivers')
  @RequirePermissions('drivers:read')
  @ApiOperation({ summary: 'List all driver profiles' })
  @ResponseMessage('Drivers')
  listDrivers() {
    return this.admin.listDrivers();
  }
}
