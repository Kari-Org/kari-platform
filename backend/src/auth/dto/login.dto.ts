import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email address or phone number', example: 'driver@example.com' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'Sup3rSecret!' })
  @IsString()
  @MinLength(1)
  password: string;
}
