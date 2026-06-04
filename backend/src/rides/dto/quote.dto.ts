import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class QuoteDto {
  @ApiProperty({ example: 6.4281 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat: number;

  @ApiProperty({ example: 3.4216 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng: number;

  @ApiPropertyOptional({ example: 'Lekki Phase 1' })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiProperty({ example: 6.5244 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  dropoffLat: number;

  @ApiProperty({ example: 3.3792 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  dropoffLng: number;

  @ApiPropertyOptional({ example: 'Yaba' })
  @IsOptional()
  @IsString()
  dropoffAddress?: string;
}
