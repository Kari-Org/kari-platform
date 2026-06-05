import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminCancelRideDto {
  @ApiPropertyOptional({ example: 'Fraudulent booking' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
