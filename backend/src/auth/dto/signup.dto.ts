import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { OtpChannel, UserRole } from '@kari/types';
import { PHONE_REGEX } from '../../common/constants/validation';

export class SignUpDto {
  @ApiProperty({ example: 'driver@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2348012345678' })
  @Matches(PHONE_REGEX, { message: 'phone must be 7–15 digits, optionally prefixed with +' })
  phone: string;

  @ApiProperty({ example: 'Sup3rSecret!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: [UserRole.DRIVER, UserRole.RIDER], example: UserRole.RIDER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    enum: OtpChannel,
    default: OtpChannel.SMS,
    description: 'Channel to deliver the verification OTP',
  })
  @IsOptional()
  @IsEnum(OtpChannel)
  channel?: OtpChannel;
}
