import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Expo / FCM push token' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ enum: ['ios', 'android', 'web'] })
  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: string;
}
