import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PHONE_REGEX } from '../../common/constants/validation';

export class EmergencyContactDto {
  @ApiProperty({ example: 'Ada Eze' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: '+2348012345678' })
  @Matches(PHONE_REGEX, { message: 'phone must be 7–15 digits, optionally prefixed with +' })
  phone: string;

  @ApiPropertyOptional({ example: 'Sister' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  relationship?: string;
}
