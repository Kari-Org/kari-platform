import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class NinDto {
  @ApiProperty({ example: '12345678901', description: '11-digit National Identification Number' })
  @Matches(/^[0-9]{11}$/, { message: 'NIN must be 11 digits' })
  nin: string;
}
