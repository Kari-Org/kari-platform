import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Route-priced subscribe (spec 0004): the fee comes from the rider's own route quote. */
export class SubscribeDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6',
    description: 'Quote ref from POST /rides/quote for your commute route',
  })
  @IsString()
  quoteRef: string;

  @ApiPropertyOptional({ example: 'Home ↔ Work' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;
}

export class PreviewSubscriptionDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6' })
  @IsString()
  quoteRef: string;
}
