import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { UserRole } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @HttpCode(201)
  @Post()
  @ApiOperation({ summary: 'Submit a support ticket (rider or driver)' })
  @ResponseMessage('Ticket submitted')
  create(
    @CurrentUser('id') id: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: CreateTicketDto,
  ) {
    return this.tickets.create(id, role, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'My submitted tickets' })
  @ResponseMessage('Tickets')
  mine(@CurrentUser('id') id: string) {
    return this.tickets.mine(id);
  }
}
