import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { APP_CONFIG, type AppConfig } from './config/config.module';
import { RedisIoAdapter } from './realtime/redis-io.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  app.useLogger(app.get(Logger));

  const config = app.get<AppConfig>(APP_CONFIG);

  app.use(helmet());
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableShutdownHooks();

  // Redis-backed Socket.IO adapter so events fan out across instances.
  const wsAdapter = new RedisIoAdapter(app, config);
  await wsAdapter.connect();
  app.useWebSocketAdapter(wsAdapter);

  // API docs — unset ⇒ on in non-prod; SWAGGER_ENABLED overrides. When
  // DOCS_USER + DOCS_PASSWORD are set, /docs is gated by HTTP basic auth.
  if (config.docs.enabled ?? !config.isProd) {
    if (config.docs.user && config.docs.password) {
      const expected =
        'Basic ' + Buffer.from(`${config.docs.user}:${config.docs.password}`).toString('base64');
      app.use(['/docs', '/docs-json'], (req: Request, res: Response, next: NextFunction) => {
        if (req.headers.authorization === expected) return next();
        res
          .set('WWW-Authenticate', 'Basic realm="Kari API Docs"')
          .status(401)
          .send('Authentication required');
      });
    }
    const docConfig = new DocumentBuilder()
      .setTitle('Kari API')
      .setDescription('Kari platform unified backend — interactive API docs')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addTag('system', 'Health and service metadata')
      .build();
    const document = SwaggerModule.createDocument(app, docConfig);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'Kari API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  await app.listen(config.port);
  app
    .get(Logger)
    .log(`Kari backend listening on http://localhost:${config.port} (${config.env})`);
}

void bootstrap();
