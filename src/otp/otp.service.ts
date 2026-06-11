import { Injectable, NotFoundException } from '@nestjs/common';
import { OtpRepository } from './otp.repository';
import { OtpGenerator } from './util/otp.genator';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { MailService } from './email.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
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

  async verifyOtp(email: string, otp: string): Promise<User | null> {
    try {
      const user: User = await this.otpRepository.findUserByMail(email);

      const otpHash: string = await this.otpRepository.getOtp(user);

      const isValid = await bcrypt.compare(otp, otpHash);

      if (!isValid) {
        return null;
      }

      await this.otpRepository.deleteOtp(email);
      return user;
    } catch (error) {
      console.error('verifyOtp error:', error);
      return null;
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
