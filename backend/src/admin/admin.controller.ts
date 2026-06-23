import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RideStatus, UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AdminService } from './admin.service';
import { Audit } from './audit/audit.decorator';
import { AuditInterceptor } from './audit/audit.interceptor';
import { TicketStatus } from '../tickets/entities/ticket.entity';
import { UpdateTicketDto } from '../tickets/dto/update-ticket.dto';
import { AdminCancelRideDto } from './dto/cancel-ride.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateDedicatedDriverDto } from './dto/create-dedicated-driver.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { VerifyDriverDto } from './dto/verify-driver.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ─── A1 · Read-only ops ──────────────────────────────────────────────────────
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

  // ─── A2 · Live fleet ───────────────────────────────────────────────────────
  @Get('fleet')
  @RequirePermissions('fleet:view')
  @ApiOperation({ summary: 'Live fleet snapshot — active drivers, positions, current rides' })
  @ResponseMessage('Fleet')
  fleet() {
    return this.admin.fleet();
  }

  // ─── A3 · Write actions (audited) ────────────────────────────────────────────
  @Patch('users/:id/status')
  @RequirePermissions('riders:manage')
  @Audit('user.status')
  @ApiOperation({ summary: 'Suspend / reactivate a user account' })
  @ResponseMessage('User status updated')
  setUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.setUserStatus(id, dto.status);
  }

  @HttpCode(200)
  @Post('drivers/:id/verify')
  @RequirePermissions('drivers:verify')
  @Audit('driver.verify')
  @ApiOperation({ summary: 'Approve or reject a driver KYC (NIN + liveness)' })
  @ResponseMessage('Driver verification updated')
  verifyDriver(@Param('id') id: string, @Body() dto: VerifyDriverDto) {
    return this.admin.verifyDriver(id, dto.approve);
  }

  @HttpCode(200)
  @Post('rides/:id/cancel')
  @RequirePermissions('trips:override')
  @Audit('trip.cancel')
  @ApiOperation({ summary: 'Admin override-cancel an active ride (no penalty)' })
  @ResponseMessage('Ride cancelled')
  cancelRide(@Param('id') id: string, @Body() dto: AdminCancelRideDto) {
    return this.admin.cancelRide(id, dto.reason);
  }

  // ─── A4 · Dedicated drivers ──────────────────────────────────────────────────
  @Post('drivers/dedicated')
  @RequirePermissions('dedicated:onboard')
  @Audit('driver.dedicated.create')
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

  // ─── A6 · Financials ─────────────────────────────────────────────────────────
  @Get('finance/summary')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Revenue, GMV, payouts + top-ups' })
  @ResponseMessage('Finance summary')
  financeSummary() {
    return this.admin.financeSummary();
  }

  @Get('finance/payouts')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Driver payout transactions, paginated' })
  @ResponseMessage('Payouts')
  payouts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.admin.payouts({ page: page ? Number(page) : 1, limit: limit ? Number(limit) : 20 });
  }

  @Get('fare-config')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Current fare + commission configuration (read-only)' })
  @ResponseMessage('Fare config')
  fareConfig() {
    return this.admin.fareConfig();
  }

  // ─── A5 · Tickets ────────────────────────────────────────────────────────────
  @Get('tickets')
  @RequirePermissions('tickets:read')
  @ApiOperation({ summary: 'Support tickets (filter by status), paginated' })
  @ResponseMessage('Tickets')
  tickets(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listTickets({
      status: status ? (status as TicketStatus) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Patch('tickets/:id')
  @RequirePermissions('tickets:manage')
  @Audit('ticket.update')
  @ApiOperation({ summary: 'Reply to / change the status of a ticket' })
  @ResponseMessage('Ticket updated')
  updateTicket(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.admin.updateTicket(id, adminId, dto);
  }

  // ─── System · Admins & roles ─────────────────────────────────────────────────
  @Get('admins')
  @RequirePermissions('admins:read')
  @ApiOperation({ summary: 'List admin accounts + their sub-roles' })
  @ResponseMessage('Admins')
  listAdmins() {
    return this.admin.listAdmins();
  }

  @Post('admins')
  @RequirePermissions('admins:manage')
  @Audit('admin.create')
  @ApiOperation({ summary: 'Create an admin account with a sub-role' })
  @ResponseMessage('Admin created')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.admin.createAdmin(dto);
  }

  @Patch('admins/:id/role')
  @RequirePermissions('admins:manage')
  @Audit('admin.role')
  @ApiOperation({ summary: "Change an admin's sub-role" })
  @ResponseMessage('Admin role updated')
  setAdminRole(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAdminRoleDto,
  ) {
    return this.admin.setAdminRole(actorId, id, dto.adminRole);
  }

  @Patch('admins/:id/status')
  @RequirePermissions('admins:manage')
  @Audit('admin.status')
  @ApiOperation({ summary: 'Activate / deactivate an admin account' })
  @ResponseMessage('Admin status updated')
  setAdminStatus(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.admin.setAdminStatus(actorId, id, dto.status);
  }

  // ─── A3 · Audit log ──────────────────────────────────────────────────────────
  @Get('audit')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Admin action audit log, paginated' })
  @ResponseMessage('Audit log')
  audit(
    @Query('action') action?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listAudit({
      action,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }
}
