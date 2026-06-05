import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PayoutDto {
  @ApiProperty({ example: 10000, description: 'Amount to withdraw to your bank, in naira' })
  @IsInt()
  @Min(1)
  amount: number;
}
