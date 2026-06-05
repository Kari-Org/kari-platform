import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { type Observable, tap } from 'rxjs';
import type { AuthUser } from '../../auth/types';
import { AUDIT_ACTION } from './audit.decorator';
import { AuditService } from './audit.service';

const REDACT = ['password', 'newPassword', 'token', 'accessToken', 'refreshToken'];

/**
 * Records an {@link AuditLog} row after any successful handler annotated with
 * `@Audit(action)`. No-op on unannotated routes, so reads are never logged.
 * Logging is best-effort and never blocks or fails the request.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<string>(AUDIT_ACTION, context.getHandler());
    if (!action) return next.handle();
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser; body?: unknown }>();
    const actor = req.user;
    const params = (req.params ?? {}) as Record<string, string>;
    return next.handle().pipe(
      tap(() => {
        void this.audit
          .record({
            actorId: actor?.id ?? null,
            actorEmail: actor?.email ?? null,
            actorRole: actor?.adminRole ?? null,
            action,
            targetId: params.id ?? null,
            method: req.method,
            path: req.path ?? req.url,
            meta: sanitize(req.body),
          })
          .catch(() => {
            /* audit logging is best-effort */
          });
      }),
    );
  }
}

function sanitize(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const out = { ...(body as Record<string, unknown>) };
  for (const k of REDACT) delete out[k];
  return Object.keys(out).length ? out : null;
}
