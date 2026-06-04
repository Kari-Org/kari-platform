import { Global, Module } from '@nestjs/common';
import { AppConfig, loadConfiguration } from './configuration';

/** DI token for the typed application config. */
export const APP_CONFIG = Symbol('APP_CONFIG');

/**
 * Global config module. Validates env once at boot and exposes the typed
 * {@link AppConfig} object under {@link APP_CONFIG}. Inject it anywhere with
 * `@Inject(APP_CONFIG) private readonly config: AppConfig`.
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => loadConfiguration(),
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}

export type { AppConfig } from './configuration';
