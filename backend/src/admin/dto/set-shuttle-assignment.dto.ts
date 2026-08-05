import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

/** Assign (driverId set) or clear (driverId null) a shuttle route's driver + bus. */
export class SetShuttleAssignmentDto {
  @ApiProperty({
    description: 'Dedicated driver userId, or null to clear the assignment',
    nullable: true,
  })
  @ValidateIf((o: SetShuttleAssignmentDto) => o.driverId !== null)
  @IsUUID()
  driverId: string | null;

  @ApiPropertyOptional({ example: 'KJA-914-XA', description: 'Required when assigning' })
  @ValidateIf((o: SetShuttleAssignmentDto) => o.driverId !== null)
  @IsString()
  @MaxLength(20)
  busPlateNumber?: string;

  @ApiPropertyOptional({ example: '14-seater Toyota Hiace' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  busLabel?: string;
}
