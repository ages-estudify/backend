import { Module } from '@nestjs/common';
import { OtpController } from './otp.controler';
import { OtpRepository } from './otp.repository';
import { OtpService } from './otp.service';
import { MailService } from './email.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OtpController],
  providers: [OtpRepository, OtpService, MailService, PrismaService],
  exports: [OtpRepository],
})
export class OtpModule {}
