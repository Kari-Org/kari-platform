import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TicketStatus } from '../entities/ticket.entity';

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ example: 'We have refunded the difference to your wallet.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reply?: string;
}
