import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { CarCategory } from '@kari/types';

export class VehicleDto {
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @MinLength(1)
  model: string;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @IsInt()
  @Min(1980)
  @Max(2100)
  year?: number;

  @ApiProperty({ example: 'LAG-123-XY' })
  @IsString()
  @MinLength(1)
  plateNumber: string;

  @ApiPropertyOptional({ example: 'Silver' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ enum: CarCategory, default: CarCategory.ECONOMY })
  @IsOptional()
  @IsEnum(CarCategory)
  category?: CarCategory;
}
