import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { AdminRole } from '@kari/types';
import { PHONE_REGEX } from '../../common/constants/validation';

export class CreateAdminDto {
  @ApiProperty({ example: 'ops@kari.test' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2348090000000' })
  @Matches(PHONE_REGEX, { message: 'phone must be 7–15 digits, optionally prefixed with +' })
  phone: string;

  @ApiProperty({ example: 'TempPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: AdminRole, example: AdminRole.OPS })
  @IsEnum(AdminRole)
  adminRole: AdminRole;
}
