import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OtpChannel, OtpPurpose, UserRole, UserStatus } from '@kari/types';
import { UsersService } from '../users/users.service';
import type { User } from '../users/entities/user.entity';
import type { JwtPayload } from './types';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { OtpService } from './services/otp.service';
import { GoogleAuthService } from './services/google.service';
import type { SignUpDto } from './dto/signup.dto';
import type { SendOtpDto } from './dto/send-otp.dto';
import type { VerifyOtpDto } from './dto/verify-otp.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { GoogleAuthDto } from './dto/google-auth.dto';

/** Strips secrets before a user is returned over the wire. */
function toPublic(user: User) {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    status: user.status,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    adminRole: user.adminRole ?? null,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly password: PasswordService,
    private readonly token: TokenService,
    private readonly otp: OtpService,
    private readonly google: GoogleAuthService,
  ) {}

  async signUp(dto: SignUpDto) {
    if (dto.role === UserRole.ADMIN) {
      throw new ForbiddenException('cannot self-register as admin');
    }
    const existing = await this.users.findByEmailOrPhone(dto.email, dto.phone);
    if (existing) {
      throw new ConflictException('email or phone already registered');
    }
    const passwordHash = await this.password.hash(dto.password);
    const user = await this.users.createPending({
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
    });
    const otp = await this.otp.send(dto.phone, OtpPurpose.SIGNUP, dto.channel ?? OtpChannel.SMS);
    return { userId: user.id, phone: user.phone, otp };
  }

  async sendOtp(dto: SendOtpDto) {
    const user = await this.users.findByPhone(dto.phone);
    if (!user) {
      throw new NotFoundException('no account registered for this phone');
    }
    return this.otp.send(dto.phone, OtpPurpose.SIGNUP, dto.channel ?? OtpChannel.SMS);
  }

  async confirmSignUp(dto: VerifyOtpDto) {
    const ok = await this.otp.verify(dto.phone, OtpPurpose.SIGNUP, dto.code);
    if (!ok) {
      throw new BadRequestException('invalid or expired code');
    }
    const user = await this.users.findByPhone(dto.phone);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    await this.users.markPhoneVerifiedAndActivate(user.id);
    user.status = UserStatus.ACTIVE;
    user.phoneVerified = true;
    const tokens = await this.token.issue(user);
    return { user: toPublic(user), tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailOrPhone(dto.identifier, dto.identifier);
    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }
    const ok = await this.password.verify(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('account not verified — confirm the OTP first');
    }
    // 2FA: a valid password mints a LOGIN-purpose OTP, but tokens are only issued
    // once it's verified (confirmLogin). Because the LOGIN OTP can only be minted
    // after the password check, the OTP step can't be used to bypass the password.
    // The client persists its session, so this path only runs on an explicit
    // re-login (fresh install, logout, or an expired refresh token).
    const channel = dto.channel ?? OtpChannel.SMS;
    const sent = await this.otp.send(user.phone, OtpPurpose.LOGIN, channel);
    return { verificationRequired: true as const, phone: user.phone, ...sent };
  }

  async confirmLogin(dto: VerifyOtpDto) {
    const ok = await this.otp.verify(dto.phone, OtpPurpose.LOGIN, dto.code);
    if (!ok) {
      throw new BadRequestException('invalid or expired code');
    }
    const user = await this.users.findByPhone(dto.phone);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const tokens = await this.token.issue(user);
    return { user: toPublic(user), tokens };
  }

  async refresh(dto: RefreshDto) {
    let payload: JwtPayload;
    try {
      payload = await this.token.verifyRefresh(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('invalid or expired refresh token');
    }
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('user not found');
    }
    const tokens = await this.token.issue(user);
    return { tokens };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findByPhone(dto.phone);
    const channel = dto.channel ?? OtpChannel.SMS;
    // Only actually send if the account exists, but always return the same
    // shape so callers can't enumerate registered phone numbers.
    if (user) {
      return this.otp.send(dto.phone, OtpPurpose.PASSWORD_RESET, channel);
    }
    return { channel, expiresInSeconds: 300 };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const ok = await this.otp.verify(dto.phone, OtpPurpose.PASSWORD_RESET, dto.code);
    if (!ok) {
      throw new BadRequestException('invalid or expired code');
    }
    const user = await this.users.findByPhone(dto.phone);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const passwordHash = await this.password.hash(dto.newPassword);
    await this.users.updatePassword(user.id, passwordHash);
    return { success: true };
  }

  async googleSignIn(dto: GoogleAuthDto) {
    const profile = await this.google.verify(dto.idToken);
    let user = await this.users.findByEmail(profile.email);
    let isNewUser = false;
    if (!user) {
      const passwordHash = await this.password.hash(randomBytes(24).toString('hex'));
      user = await this.users.createActive({
        email: profile.email,
        // Google doesn't supply a phone; store a unique placeholder the rider
        // can replace later (login-by-phone won't match it).
        phone: `g-${profile.sub}`.slice(0, 32),
        passwordHash,
        role: UserRole.RIDER,
      });
      isNewUser = true;
    }
    const tokens = await this.token.issue(user);
    return { user: toPublic(user), tokens, isNewUser };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return toPublic(user);
  }
}
