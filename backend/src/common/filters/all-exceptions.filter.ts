import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ZodError } from 'zod';
import type { ApiError, ApiResponse } from '@kari/types';

const STATUS_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
};

const codeForStatus = (status: number): string =>
  STATUS_CODE[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : `HTTP_${status}`);

/**
 * Catches every thrown error and renders it as the uniform {@link ApiResponse}
 * envelope. Normalizes Nest HTTP errors, class-validator failures, Zod errors,
 * and TypeORM query failures; everything else becomes a 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    const { status, message, error } = this.normalize(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status} ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error,
      timestamp: new Date().toISOString(),
      traceId: req.id,
    };
    res.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; message: string; error: ApiError } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      let message = exception.message;
      let detail: string | undefined;

      if (response && typeof response === 'object') {
        const r = response as { message?: unknown };
        if (Array.isArray(r.message)) {
          message = 'Validation failed';
          detail = r.message.join('; ');
        } else if (typeof r.message === 'string') {
          message = r.message;
        }
      }
      return { status, message, error: { code: codeForStatus(status), detail } };
    }

    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          detail: exception.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      };
    }

    if (exception instanceof QueryFailedError) {
      const e = exception as QueryFailedError & { code?: string; detail?: string };
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Database constraint violation',
        error: { code: e.code ?? 'DB_ERROR', detail: e.detail },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: { code: 'INTERNAL_ERROR' },
    };
  }
}
