import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';

/**
 * Structured logging via pino. Every request gets a trace id (reused from an
 * inbound `x-request-id` header or generated) and echoed back as `x-trace-id`,
 * so log lines and error responses share one correlation id.
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.logLevel,
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const id = (req.headers['x-request-id'] as string) || randomUUID();
            res.setHeader('x-trace-id', id);
            return id;
          },
          redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-api-key"]'],
          autoLogging: !config.isTest,
          transport: config.isProd
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
