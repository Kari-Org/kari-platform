import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AdminRole } from '@kari/types';

export class UpdateAdminRoleDto {
  @ApiProperty({ enum: AdminRole, example: AdminRole.OPS })
  @IsEnum(AdminRole)
  adminRole: AdminRole;
}
