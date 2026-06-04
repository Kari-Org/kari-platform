import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../types';

/**
 * Injects the authenticated user (or a single field of it):
 * `@CurrentUser() user: AuthUser` or `@CurrentUser('id') id: string`.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = req.user;
    return field && user ? user[field] : user;
  },
);
