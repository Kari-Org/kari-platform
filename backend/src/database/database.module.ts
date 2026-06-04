import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { APP_CONFIG, type AppConfig } from '../config/config.module';

/**
 * PostgreSQL via TypeORM. Entities are auto-loaded from feature modules
 * (`TypeOrmModule.forFeature([...])`). Schema changes go through migrations;
 * `synchronize` is only ever enabled in local/staging via config.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        type: 'postgres',
        host: config.database.host,
        port: config.database.port,
        username: config.database.user,
        password: config.database.password,
        database: config.database.name,
        autoLoadEntities: true,
        synchronize: config.database.synchronize,
        logging: config.database.logging,
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        retryAttempts: config.isProd ? 10 : 3,
        retryDelay: 1500,
      }),
    }),
  ],
})
export class DatabaseModule {}
