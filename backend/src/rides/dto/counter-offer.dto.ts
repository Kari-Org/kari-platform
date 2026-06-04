import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CounterOfferDto {
  @ApiProperty({ example: 1800, description: 'Driver counter — at most the standard fare' })
  @IsInt()
  @IsPositive()
  amount: number;
}
