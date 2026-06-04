import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import type { AuthUser, JwtPayload } from './types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.accessSecret,
    });
  }

  /** Return value becomes `request.user`. */
  validate(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      phone: payload.phone,
      adminRole: payload.adminRole ?? null,
    };
  }
}
