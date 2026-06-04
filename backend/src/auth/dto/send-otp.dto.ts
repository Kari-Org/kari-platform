import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, Matches } from 'class-validator';
import { OtpChannel } from '@kari/types';
import { PHONE_REGEX } from '../../common/constants/validation';

export class SendOtpDto {
  @ApiProperty({ example: '+2348012345678' })
  @Matches(PHONE_REGEX, { message: 'phone must be 7–15 digits, optionally prefixed with +' })
  phone: string;

  @ApiPropertyOptional({ enum: OtpChannel, default: OtpChannel.SMS })
  @IsOptional()
  @IsEnum(OtpChannel)
  channel?: OtpChannel;
}
