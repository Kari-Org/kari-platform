import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, Max, Min } from 'class-validator';

export class DriverQuizDto {
  @ApiProperty({
    example: [4, 2, 5, 3, 1],
    description: 'Quiz answers on a 1 (disagree) – 5 (agree) Likert. Averaged into a personality.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(5, { each: true })
  answers: number[];
}
