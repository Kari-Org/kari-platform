import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';
import { OTP_CODE_REGEX, PHONE_REGEX } from '../../common/constants/validation';

export class ResetPasswordDto {
  @ApiProperty({ example: '+2348012345678' })
  @Matches(PHONE_REGEX, { message: 'phone must be 7–15 digits, optionally prefixed with +' })
  phone: string;

  @ApiProperty({ example: '1234' })
  @Matches(OTP_CODE_REGEX, { message: 'code must be 4 digits' })
  code: string;

  @ApiProperty({ example: 'N3wSecret!', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
