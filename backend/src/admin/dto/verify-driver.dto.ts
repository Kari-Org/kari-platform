import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class VerifyDriverDto {
  @ApiProperty({ example: true, description: 'true = approve KYC, false = reject' })
  @IsBoolean()
  approve: boolean;
}
