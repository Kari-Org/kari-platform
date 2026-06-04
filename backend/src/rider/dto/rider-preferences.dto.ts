import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccessibilityNeed, BehaviorPreference, MusicPreference } from '@kari/types';

/**
 * The 5-question ride-preferences survey collected during onboarding.
 * Every field is optional so the survey can be saved incrementally.
 * (Frequent destinations beyond a single home address use SavedAddress.)
 */
export class RiderPreferencesDto {
  @ApiPropertyOptional({
    enum: BehaviorPreference,
    description: 'Driver interaction: talkative / quiet (RESERVED) / neutral',
  })
  @IsOptional()
  @IsEnum(BehaviorPreference)
  preferredDriverBehavior?: BehaviorPreference;

  @ApiPropertyOptional({ enum: MusicPreference })
  @IsOptional()
  @IsEnum(MusicPreference)
  musicPreference?: MusicPreference;

  @ApiPropertyOptional({ enum: AccessibilityNeed })
  @IsOptional()
  @IsEnum(AccessibilityNeed)
  accessibilityNeed?: AccessibilityNeed;

  @ApiPropertyOptional({ example: true, description: 'Opt in to notifications, discounts & promotions' })
  @IsOptional()
  @IsBoolean()
  promotionsOptIn?: boolean;

  @ApiPropertyOptional({ example: '12 Allen Ave, Ikeja', description: 'Frequent destination / home address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  homeAddress?: string;
}
