import { Global, Logger, Module, type Provider } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import {
  EMAIL_PROVIDER,
  IDENTITY_PROVIDER,
  LIVENESS_PROVIDER,
  MAPS_PROVIDER,
  PAYMENT_PROVIDER,
  PUSH_PROVIDER,
  SMS_PROVIDER,
  STORAGE_PROVIDER,
  VOICE_PROVIDER,
  WHATSAPP_PROVIDER,
} from './contracts';
import {
  NoopEmailProvider,
  NoopIdentityProvider,
  NoopLivenessProvider,
  NoopMapsProvider,
  NoopPaymentProvider,
  NoopPushProvider,
  NoopSmsProvider,
  NoopStorageProvider,
  NoopVoiceProvider,
  NoopWhatsAppProvider,
} from './noop.providers';
import { PaystackPaymentProvider } from './paystack.provider';

const log = new Logger('Providers');

/** Logs once whether a capability is configured; real impls land in later phases. */
function note(capability: string, configured: boolean, vendor: string): void {
  if (configured) {
    log.log(`${capability}: ${vendor} credentials present (real impl lands in its phase; using no-op for now)`);
  } else {
    log.log(`${capability}: no credentials — using no-op implementation`);
  }
}

/**
 * Every external capability sits behind an interface and a DI token. Concrete
 * vendors (Paystack, Dojah, Termii, Twilio, S3, Google, Rekognition, Expo) are
 * swapped here by config — no keys or vendor SDKs leak into feature code.
 * Phase 0 ships no-op implementations for all of them.
 */
const providers: Provider[] = [
  {
    provide: PAYMENT_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      if (c.providers.paystack.secretKey) {
        log.log('Payments: Paystack credentials present — using live Paystack provider');
        return new PaystackPaymentProvider(c.providers.paystack.secretKey);
      }
      note('Payments', false, 'Paystack');
      return new NoopPaymentProvider();
    },
  },
  {
    provide: IDENTITY_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('Identity/NIN', !!c.providers.dojah.apiKey, 'Dojah');
      return new NoopIdentityProvider();
    },
  },
  {
    provide: SMS_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('SMS', !!c.providers.termii.apiKey, 'Termii');
      return new NoopSmsProvider();
    },
  },
  {
    provide: WHATSAPP_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('WhatsApp', !!c.providers.twilio.accountSid, 'Twilio');
      return new NoopWhatsAppProvider();
    },
  },
  {
    provide: STORAGE_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('Storage', !!c.providers.aws.s3Bucket, 'AWS S3');
      return new NoopStorageProvider();
    },
  },
  {
    provide: MAPS_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('Maps', !!c.providers.google.mapsApiKey, 'Google Maps');
      return new NoopMapsProvider();
    },
  },
  {
    provide: LIVENESS_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('Liveness', !!c.providers.aws.accessKeyId, 'AWS Rekognition');
      return new NoopLivenessProvider();
    },
  },
  {
    provide: PUSH_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('Push', !!c.providers.expo.accessToken, 'Expo');
      return new NoopPushProvider();
    },
  },
  {
    provide: EMAIL_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('Email', !!c.providers.email.apiKey, 'Email');
      return new NoopEmailProvider();
    },
  },
  {
    provide: VOICE_PROVIDER,
    inject: [APP_CONFIG],
    useFactory: (c: AppConfig) => {
      note('Voice (masked calls)', !!c.providers.twilio.accountSid, 'Twilio Voice');
      return new NoopVoiceProvider();
    },
  },
];

@Global()
@Module({
  providers,
  exports: providers.map((p) => (p as { provide: symbol }).provide),
})
export class ProvidersModule {}
