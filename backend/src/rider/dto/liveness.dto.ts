import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RiderLivenessDto {
  @ApiProperty({ description: 'Base64-encoded selfie (JPEG/PNG; data: prefix optional)' })
  @IsString()
  @MinLength(16)
  image: string;
}
