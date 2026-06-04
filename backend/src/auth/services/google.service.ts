import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}

/**
 * Verifies Google ID tokens from the client OAuth flow.
 *
 * - When GOOGLE_OAUTH_CLIENT_IDS is configured, the token signature + audience
 *   are verified properly (the production path).
 * - In development with no client IDs set, the token is decoded WITHOUT
 *   signature verification so the flow is testable locally. This path is hard
 *   off in production.
 */
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly client = new OAuth2Client();

  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}

  async verify(idToken: string): Promise<GoogleProfile> {
    const clientIds = this.cfg.providers.google.oauthClientIds;

    if (clientIds.length > 0) {
      try {
        const ticket = await this.client.verifyIdToken({ idToken, audience: clientIds });
        const p = ticket.getPayload();
        if (!p?.email || !p.sub) {
          throw new Error('token payload missing email/sub');
        }
        return {
          sub: p.sub,
          email: p.email,
          emailVerified: Boolean(p.email_verified),
          firstName: p.given_name,
          lastName: p.family_name,
        };
      } catch (err) {
        this.logger.warn(`Google token verification failed: ${String(err)}`);
        throw new UnauthorizedException('invalid Google token');
      }
    }

    if (this.cfg.isProd) {
      throw new UnauthorizedException('Google login is not configured');
    }

    const profile = this.decodeUnsafe(idToken);
    this.logger.warn(
      `[dev] Google token accepted WITHOUT signature verification — set ` +
        `GOOGLE_OAUTH_CLIENT_IDS to enable real verification (email=${profile.email})`,
    );
    return profile;
  }

  /** Dev-only: decode the JWT payload without verifying the signature. */
  private decodeUnsafe(idToken: string): GoogleProfile {
    try {
      const payloadB64 = idToken.split('.')[1];
      const json = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8')) as {
        sub?: string;
        email?: string;
        email_verified?: boolean;
        given_name?: string;
        family_name?: string;
      };
      if (!json.email || !json.sub) {
        throw new Error('missing claims');
      }
      return {
        sub: json.sub,
        email: json.email,
        emailVerified: Boolean(json.email_verified),
        firstName: json.given_name,
        lastName: json.family_name,
      };
    } catch {
      throw new UnauthorizedException('malformed Google token');
    }
  }
}
