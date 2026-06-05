import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { EmergencyContactDto } from './dto/emergency-contact.dto';
import { PanicDto } from './dto/panic.dto';
import { SafetyService } from './safety.service';

@ApiTags('safety')
@ApiBearerAuth()
@Controller('safety')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  @HttpCode(200)
  @Post('contacts')
  @ApiOperation({ summary: 'Add an emergency contact' })
  @ResponseMessage('Contact added')
  addContact(@CurrentUser('id') id: string, @Body() dto: EmergencyContactDto) {
    return this.safety.addContact(id, dto);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'List my emergency contacts' })
  @ResponseMessage('Contacts')
  listContacts(@CurrentUser('id') id: string) {
    return this.safety.listContacts(id);
  }

  @Delete('contacts/:id')
  @ApiOperation({ summary: 'Remove an emergency contact' })
  @ResponseMessage('Contact removed')
  removeContact(@CurrentUser('id') id: string, @Param('id') contactId: string) {
    return this.safety.removeContact(id, contactId);
  }

  @HttpCode(200)
  @Post('panic')
  @ApiOperation({ summary: 'Raise a panic/SOS alert (notifies emergency contacts + ops)' })
  @ResponseMessage('Panic alert raised')
  panic(@CurrentUser('id') id: string, @Body() dto: PanicDto) {
    return this.safety.panic(id, dto);
  }

  @HttpCode(200)
  @Post('panic/:id/resolve')
  @ApiOperation({ summary: 'Resolve a panic alert' })
  @ResponseMessage('Panic resolved')
  resolve(@CurrentUser('id') id: string, @Param('id') eventId: string) {
    return this.safety.resolvePanic(id, eventId);
  }
}
