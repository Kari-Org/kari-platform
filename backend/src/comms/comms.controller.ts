import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CommsService } from './comms.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('comms')
@ApiBearerAuth()
@Controller('rides')
export class CommsController {
  constructor(private readonly comms: CommsService) {}

  @HttpCode(200)
  @Post(':id/messages')
  @ApiOperation({ summary: 'Send an in-ride chat message (delivered live over the socket)' })
  @ResponseMessage('Message sent')
  send(@CurrentUser('id') id: string, @Param('id') rideId: string, @Body() dto: SendMessageDto) {
    return this.comms.send(id, rideId, dto.body);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Chat history for a ride' })
  @ResponseMessage('Messages')
  history(@CurrentUser('id') id: string, @Param('id') rideId: string) {
    return this.comms.history(id, rideId);
  }

  @HttpCode(200)
  @Post(':id/call')
  @ApiOperation({ summary: 'Start a masked call between the ride participants' })
  @ResponseMessage('Call connected')
  call(@CurrentUser('id') id: string, @Param('id') rideId: string) {
    return this.comms.maskedCall(id, rideId);
  }
}
