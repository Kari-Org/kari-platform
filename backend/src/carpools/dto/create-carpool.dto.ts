import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';
import { CarCategory } from '@kari/types';

export class CreateCarpoolDto {
  @ApiProperty({ description: 'A quote ref from POST /rides/quote' })
  @IsString()
  quoteRef: string;

  @ApiProperty({ enum: CarCategory })
  @IsEnum(CarCategory)
  carCategory: CarCategory;

  @ApiPropertyOptional({ minimum: 2, maximum: 4, default: 4 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(4)
  maxSeats?: number;

  @ApiPropertyOptional({ description: 'Planned departure (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  departAt?: string;
}
