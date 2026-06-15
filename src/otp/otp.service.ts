import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OtpRepository } from './otp.repository';
import { OtpGenerator } from './util/otp.genator';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { MailService } from './email.service';
import { Purpose } from '../auth/security/jwt-claims';
import { AuthService, LoginResult } from '../auth/auth.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
  ) {}

  async generateAndSendOtp(email: string) {
    const user: User =
      (await this.otpRepository.findUserByMail(email)) ??
      (() => {
        throw new NotFoundException('User not found');
      })();

    const otp: string = OtpGenerator.generate();
    const otpHash = await bcrypt.hash(otp, this.resolveBcryptRounds());

    await this.otpRepository.saveOtp(otpHash, user);
    await this.mailService.sendOtp(user.email, otp);
  }

  async verifyOtp(email: string, otp: string): Promise<LoginResult | null> {
    try {
      const user: User = await this.otpRepository.findUserByMail(email);

      const otpHash: string = await this.otpRepository.getOtp(user);

      const isValid = await bcrypt.compare(otp, otpHash);

      if (!isValid) {
        throw new UnauthorizedException('OTP inválido');
      }

      await this.otpRepository.deleteOtp(email);
      return await this.authService.buildAuthSession(user, Purpose.PASSWORDRESET);
    } catch (error) {
      throw new UnauthorizedException('OTP inválido', error);
    }
  }

  private resolveBcryptRounds(): number {
    const parsed = Number.parseInt(this.config.get<string>('BCRYPT_ROUNDS') ?? '', 10);
    if (Number.isFinite(parsed) && parsed >= 4 && parsed <= 15) {
      return parsed;
    }
    return 10;
  }
}
