import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class PanicDto {
  @ApiPropertyOptional({ description: 'The ride in progress, if any' })
  @IsOptional()
  @IsUUID()
  rideId?: string;

  @ApiProperty({ example: 6.51 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 3.3715 })
  @IsNumber()
  lng: number;
}
