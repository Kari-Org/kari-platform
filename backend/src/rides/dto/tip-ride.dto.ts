import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaymentMethod } from '@kari/types';

export class TipRideDto {
  @ApiProperty({ example: 500, description: 'Tip amount, in naira' })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    default: PaymentMethod.WALLET,
    description: 'WALLET (ledger-settled rider→driver) or CASH (recorded + notified only)',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}
