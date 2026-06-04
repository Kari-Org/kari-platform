import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { ResponseMessage } from './common/decorators/response-message.decorator';

@ApiTags('system')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ResponseMessage('Service healthy')
  health() {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }

  @Public()
  @Get()
  @ResponseMessage('Kari API')
  root() {
    return { name: 'kari-backend', docs: '/docs' };
  }
}
