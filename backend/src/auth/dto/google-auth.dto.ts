import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token (JWT) returned by the client OAuth flow' })
  @IsString()
  @MinLength(16)
  idToken: string;
}
