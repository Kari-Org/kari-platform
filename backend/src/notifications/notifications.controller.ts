import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @HttpCode(200)
  @Post('devices')
  @ApiOperation({ summary: 'Register a push device token' })
  @ResponseMessage('Device registered')
  register(@CurrentUser('id') id: string, @Body() dto: RegisterDeviceDto) {
    return this.notifications.registerDevice(id, dto.token, dto.platform ?? 'unknown');
  }

  @Get()
  @ApiOperation({ summary: 'My in-app notifications' })
  @ResponseMessage('Notifications')
  list(@CurrentUser('id') id: string) {
    return this.notifications.list(id);
  }

  @HttpCode(200)
  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification read' })
  @ResponseMessage('Marked read')
  read(@CurrentUser('id') id: string, @Param('id') notificationId: string) {
    return this.notifications.markRead(id, notificationId);
  }
}
