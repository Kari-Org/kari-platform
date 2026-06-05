import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ApplyReferralDto {
  @ApiProperty({ example: 'K7PQR2M', description: "A referrer's code" })
  @IsString()
  @Length(4, 16)
  code: string;
}
