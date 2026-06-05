import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'MONTHLY_COMMUTE', description: 'A plan id from GET /subscriptions/plans' })
  @IsString()
  planId: string;
}
