import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class BookShuttleDto {
  @ApiProperty({ description: 'Pickup stop id' })
  @IsUUID()
  fromStopId: string;

  @ApiProperty({ description: 'Drop-off stop id (must be later on the route)' })
  @IsUUID()
  toStopId: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  seats?: number;
}
