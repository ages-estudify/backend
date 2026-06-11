import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { CreateOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { AuthService } from '../auth/auth.service';

@ApiTags('otp')
@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private readonly AuthService: AuthService,
  ) {}

  @Post('create')
  async create(@Body() dto: CreateOtpDto) {
    try {
      await this.otpService.generateAndSendOtp(dto.email);
    } catch (error) {
      console.error('Failed to generate/send OTP:', error);
    }

    return {
      success: true,
      message: 'Se o e-mail estiver cadastrado, um código foi enviado.',
    };
  }

  @Post('verify')
  async verify(@Body() dto: VerifyOtpDto) {
    const user = await this.otpService.verifyOtp(dto.email, dto.otp);

    if (!user) {
      throw new UnauthorizedException('OTP inválido');
    }

    const data = await this.AuthService.buildAuthSession(user, true);

    return { success: true as const, data };
  }
}
