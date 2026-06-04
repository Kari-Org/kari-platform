import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelRideDto {
  @ApiPropertyOptional({ example: 'Driver took too long' })
  @IsOptional()
  @IsString()
  reason?: string;
}
