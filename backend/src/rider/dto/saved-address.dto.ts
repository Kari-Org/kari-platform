import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Max, Min, MinLength } from 'class-validator';
import { AddressLabel } from '@kari/types';

export class SavedAddressDto {
  @ApiProperty({ enum: AddressLabel, example: AddressLabel.HOME })
  @IsEnum(AddressLabel)
  label: AddressLabel;

  @ApiProperty({ example: '12 Admiralty Way, Lekki' })
  @IsString()
  @MinLength(1)
  address: string;

  @ApiProperty({ example: 6.4281 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 3.4216 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
