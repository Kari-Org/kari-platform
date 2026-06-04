import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@kari/types';

export const PERMISSIONS_KEY = 'permissions';

/** Restricts a route to admins whose role grants ALL the listed permissions. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
