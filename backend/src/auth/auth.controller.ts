import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyPhoneAuthDto } from './dto/verify-phone-auth.dto';
import { SocialAuthDto, RegisterDeviceDto } from './dto/social-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DevicesService } from '../devices/devices.service';
import { User } from '../users/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly devicesService: DevicesService,
  ) {}

  // ─── Phone OTP (Firebase SMS on client) ──────────────────────────────────

  @Post('phone/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate phone number before Firebase sends SMS OTP' })
  @ApiResponse({ status: 200, description: 'Phone is allowed to receive OTP' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  checkPhone(@Body() dto: SendOtpDto) {
    return this.authService.checkPhoneForAuth(dto);
  }

  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Firebase phone auth token and get JWT' })
  @ApiResponse({ status: 200, description: 'JWT token returned' })
  @ApiResponse({ status: 401, description: 'Invalid Firebase token' })
  verifyPhone(@Body() dto: VerifyPhoneAuthDto) {
    return this.authService.verifyPhoneAuth(dto);
  }

  // ─── Social Auth ─────────────────────────────────────────────────────────

  @Post('social')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/Register via Google, Facebook or Apple' })
  @ApiResponse({ status: 200, description: 'JWT token returned' })
  socialAuth(@Body() dto: SocialAuthDto) {
    return this.authService.socialAuth(dto);
  }

  // ─── Device Registration ─────────────────────────────────────────────────

  @Post('device/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register device FCM token for push notifications' })
  registerDevice(@CurrentUser() user: User, @Body() dto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(user.id, dto);
  }

  // ─── Me ──────────────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getMe(@CurrentUser() user: User) {
    return { user };
  }

  // Called when user clicks the reset link in their email
  @Post('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consume a password reset token (returns new JWT)' })
  consumeResetToken(@Param('token') token: string) {
    return this.authService.consumeResetToken(token);
  }
}
