import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { SignUpDto } from './dto/signup.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a driver or rider; sends a phone OTP' })
  @ResponseMessage('Signup successful — verify the code sent to your phone')
  signup(@Body() dto: SignUpDto) {
    return this.auth.signUp(dto);
  }

  @Public()
  @Post('send-otp')
  @ApiOperation({ summary: 'Resend the phone verification OTP (SMS or WhatsApp)' })
  @ResponseMessage('OTP sent')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto);
  }

  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Confirm signup with the OTP; returns tokens' })
  @ResponseMessage('Phone verified')
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.confirmSignUp(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  @ApiOperation({ summary: 'Validate email/phone + password; sends a login OTP (2FA)' })
  @ResponseMessage('Enter the verification code sent to your phone')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('login/verify')
  @ApiOperation({ summary: 'Confirm a login with the OTP; returns tokens' })
  @ResponseMessage('Login successful')
  loginVerify(@Body() dto: VerifyOtpDto) {
    return this.auth.confirmLogin(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('google')
  @ApiOperation({ summary: 'Sign in or sign up with a Google ID token' })
  @ResponseMessage('Google sign-in successful')
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.googleSignIn(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ResponseMessage('Token refreshed')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send a password-reset OTP (SMS or WhatsApp)' })
  @ResponseMessage('If the account exists, a reset code was sent')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset the password using the OTP code' })
  @ResponseMessage('Password reset successful')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ResponseMessage('Current user')
  me(@CurrentUser('id') id: string) {
    return this.auth.me(id);
  }
}
