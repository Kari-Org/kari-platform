import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { TicketCategory } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ example: 'Driver took a longer route' })
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  subject: string;

  @ApiProperty({ example: 'My trip went off-route and the fare was higher than quoted.' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ description: 'Related ride id, if applicable' })
  @IsOptional()
  @IsUUID()
  rideId?: string;
}
