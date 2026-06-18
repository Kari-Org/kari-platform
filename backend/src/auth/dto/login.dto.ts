import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { OtpChannel } from '@kari/types';

export class LoginDto {
  @ApiProperty({ description: 'Email address or phone number', example: 'driver@example.com' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'Sup3rSecret!' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({
    enum: OtpChannel,
    description: 'Channel for the login verification OTP (defaults to SMS)',
  })
  @IsOptional()
  @IsEnum(OtpChannel)
  channel?: OtpChannel;
}
