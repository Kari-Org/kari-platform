import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class DriverLocationDto {
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
