import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { APP_CONFIG, type AppConfig } from '../config/config.module';

/**
 * PostgreSQL via TypeORM. Entities are auto-loaded from feature modules
 * (`TypeOrmModule.forFeature([...])`). Schema changes go through migrations;
 * `synchronize` is only ever enabled in local/staging via config. In production
 * (`synchronize` off) pending migrations run on boot — see `migrationsRun` below.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        type: 'postgres',
        // A managed DATABASE_URL wins over the discrete host/port/credentials.
        ...(config.database.url
          ? {
              url: config.database.url,
              ssl: config.database.ssl ? { rejectUnauthorized: false } : undefined,
            }
          : {
              host: config.database.host,
              port: config.database.port,
              username: config.database.user,
              password: config.database.password,
              database: config.database.name,
            }),
        autoLoadEntities: true,
        synchronize: config.database.synchronize,
        logging: config.database.logging,
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        // When synchronize is off (prod/staging), run pending migrations on boot
        // so a deploy brings the schema up to date. When synchronize is on (local
        // dev), it owns the schema and migrations must not also run.
        migrationsRun: !config.database.synchronize,
        retryAttempts: config.isProd ? 10 : 3,
        retryDelay: 1500,
      }),
    }),
  ],
})
export class DatabaseModule {}
