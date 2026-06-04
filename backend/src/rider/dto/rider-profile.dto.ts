import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BehaviorPreference, Gender } from '@kari/types';

export class RiderProfileDto {
  @ApiProperty({ example: 'Tunde' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Bello' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiPropertyOptional({ enum: BehaviorPreference, default: BehaviorPreference.NO_PREFERENCE })
  @IsOptional()
  @IsEnum(BehaviorPreference)
  preferredDriverBehavior?: BehaviorPreference;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'KARI-7F3A', description: 'Referral code the rider was given' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  referralCode?: string;
}
