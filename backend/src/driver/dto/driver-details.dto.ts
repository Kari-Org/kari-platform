import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PHONE_REGEX } from '../../common/constants/validation';

export class DriverDetailsDto {
  @ApiProperty({ example: '0123456789' })
  @IsString()
  @MinLength(6)
  bankAccountNumber: string;

  @ApiProperty({ example: 'GTBank' })
  @IsString()
  @MinLength(1)
  bankName: string;

  @ApiProperty({ example: 'Ada Okafor' })
  @IsString()
  @MinLength(1)
  bankAccountName: string;

  @ApiProperty({ example: 'Chidi Okafor' })
  @IsString()
  @MinLength(1)
  nokName: string;

  @ApiProperty({ example: '+2348011112222' })
  @Matches(PHONE_REGEX, { message: 'next-of-kin phone must be a valid number' })
  nokPhone: string;

  @ApiProperty({ example: 'Brother' })
  @IsString()
  @MinLength(1)
  nokRelationship: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  spotifyInstalled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  appleMusicInstalled?: boolean;
}
