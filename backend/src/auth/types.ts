import type { AdminRole, UserRole } from '@kari/types';

/** Decoded JWT access-token claims. `sub` is the user id. */
export interface JwtPayload {
  sub: string;
  role: UserRole;
  email?: string;
  phone?: string;
  adminRole?: AdminRole | null;
  iat?: number;
  exp?: number;
}

/** The authenticated principal attached to requests/sockets after verification. */
export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  phone?: string;
  adminRole?: AdminRole | null;
}
