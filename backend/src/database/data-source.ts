import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { loadConfiguration } from '../config/configuration';

/**
 * Standalone DataSource for the TypeORM CLI (migration generate/run/revert).
 * Mirrors {@link DatabaseModule} but is usable outside the Nest DI container.
 */
const config = loadConfiguration();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: config.database.logging,
});

export default AppDataSource;
