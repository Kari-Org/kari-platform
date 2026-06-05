import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION = 'audit:action';

/**
 * Marks a write handler for audit logging. The {@link AuditInterceptor} records
 * an {@link AuditLog} row (actor, action, target, request body) after the handler
 * succeeds. Reads are never audited — only annotated routes.
 */
export const Audit = (action: string) => SetMetadata(AUDIT_ACTION, action);
