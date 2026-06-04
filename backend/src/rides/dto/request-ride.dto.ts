import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { CarCategory, PaymentMethod, PriceType } from '@kari/types';

export class RequestRideDto {
  @ApiProperty({ description: 'Reference from POST /rides/quote' })
  @IsString()
  quoteRef: string;

  @ApiProperty({ enum: CarCategory, example: CarCategory.ECONOMY })
  @IsEnum(CarCategory)
  carCategory: CarCategory;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: PriceType, default: PriceType.STANDARD })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @ApiPropertyOptional({
    example: 1500,
    description: 'Required for NEGOTIATE — rider-proposed fare (no lower limit)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  riderProposedPrice?: number;
}
