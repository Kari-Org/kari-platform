import { IsBoolean } from 'class-validator';

export class CarpoolModeDto {
  @IsBoolean()
  enabled: boolean;
}
