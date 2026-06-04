'use client';

import { hasPermission, type Permission } from '@kari/types';
import { useSession } from './session-provider';

/** Hook: does the signed-in admin hold this permission? */
export function useCan(permission: Permission): boolean {
  const user = useSession();
  return hasPermission(user.adminRole, permission);
}

/** Renders children only if the admin holds the permission. */
export function Can({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  return useCan(permission) ? <>{children}</> : null;
}
