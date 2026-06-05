import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class TopupDto {
  @ApiProperty({ example: 5000, description: 'Amount to add to the wallet, in naira' })
  @IsInt()
  @Min(1)
  amount: number;
}
