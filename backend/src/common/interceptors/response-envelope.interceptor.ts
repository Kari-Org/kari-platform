import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '@kari/types';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

/**
 * Wraps successful HTTP responses in the uniform {@link ApiResponse} envelope.
 * Non-HTTP contexts (e.g. WebSocket) pass through untouched.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request & { id?: string }>();
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'OK';

    return next.handle().pipe(
      map(
        (data): ApiResponse => ({
          success: true,
          message,
          data: data ?? null,
          timestamp: new Date().toISOString(),
          traceId: req.id,
        }),
      ),
    );
  }
}
