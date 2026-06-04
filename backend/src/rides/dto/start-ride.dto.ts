import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { OTP_CODE_REGEX } from '../../common/constants/validation';

export class StartRideDto {
  @ApiProperty({ example: '1234', description: "The rider's 4-digit start PIN" })
  @Matches(OTP_CODE_REGEX, { message: 'start code must be 4 digits' })
  otp: string;
}
