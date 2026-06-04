import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LivenessCheckDto {
  @ApiProperty({ example: 'noop-session', description: 'Session id from the liveness/session step' })
  @IsString()
  sessionId: string;
}
