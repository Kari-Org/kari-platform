import { Inject, Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { APP_CONFIG, type AppConfig } from '../../config/config.module';
import type { User } from '../../users/entities/user.entity';
import type { JwtPayload } from '../types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Issues short-lived access tokens and longer-lived refresh tokens (separate secrets). */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  async issue(user: User): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone,
        adminRole: user.adminRole ?? null,
      },
      {
        secret: this.cfg.jwt.accessSecret,
        expiresIn: this.cfg.jwt.accessTtl as JwtSignOptions['expiresIn'],
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, typ: 'refresh' },
      {
        secret: this.cfg.jwt.refreshSecret,
        expiresIn: this.cfg.jwt.refreshTtl as JwtSignOptions['expiresIn'],
      },
    );
    return { accessToken, refreshToken };
  }

  verifyRefresh(token: string): Promise<JwtPayload> {
    return this.jwt.verifyAsync<JwtPayload>(token, { secret: this.cfg.jwt.refreshSecret });
  }
}
