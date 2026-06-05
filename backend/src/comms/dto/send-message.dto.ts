import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: "I'm at the gate." })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
