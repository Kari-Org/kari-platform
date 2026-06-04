import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MinLength } from 'class-validator';

export class DriverPersonalDto {
  @ApiProperty({ example: 'Ada' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ example: '1990-05-14' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 'Anambra' })
  @IsString()
  @MinLength(1)
  origin: string;
}
