import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { type Permission, hasPermission } from '@kari/types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthUser } from '../types';

/**
 * Allows the request only if the authenticated admin's `adminRole` grants every
 * permission listed in `@RequirePermissions(...)`. Reads the same ROLE_PERMISSIONS
 * map (`@kari/types`) the admin console uses to gate its menu — one source of truth.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const role = req.user?.adminRole ?? null;
    const ok = required.every((p) => hasPermission(role, p));
    if (!ok) {
      throw new ForbiddenException('insufficient admin permissions');
    }
    return true;
  }
}
