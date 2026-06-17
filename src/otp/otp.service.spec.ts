import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { OtpRepository } from './otp.repository';
import { MailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from '../auth/auth.service';

jest.mock('bcrypt');

describe('OtpService', () => {
  let service: OtpService;

  const otpRepositoryMock = {
    findUserByMail: jest.fn(),
    saveOtp: jest.fn(),
    getOtp: jest.fn(),
    deleteOtp: jest.fn(),
  };

  const mailServiceMock = {
    sendOtp: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const authServiceMock = {
    buildAuthSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: OtpRepository, useValue: otpRepositoryMock },
        { provide: MailService, useValue: mailServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);

    jest.clearAllMocks();
  });

  describe('generateAndSendOtp', () => {
    it('should generate, hash and send OTP', async () => {
      otpRepositoryMock.findUserByMail.mockResolvedValue({
        id: 1,
        email: 'test@mail.com',
      });

      configServiceMock.get.mockReturnValue('10');

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_otp');

      await service.generateAndSendOtp('test@mail.com');

      expect(otpRepositoryMock.findUserByMail).toHaveBeenCalledWith('test@mail.com');
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(otpRepositoryMock.saveOtp).toHaveBeenCalledWith(
        'hashed_otp',
        expect.objectContaining({ email: 'test@mail.com' }),
      );
      expect(mailServiceMock.sendOtp).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      otpRepositoryMock.findUserByMail.mockResolvedValue(null);

      await expect(service.generateAndSendOtp('notfound@mail.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should return login response when OTP is valid', async () => {
      const user = {
        id: 1,
        email: 'test@mail.com',
        role: Role.USER,
        plan_end_date: null,
      };

      otpRepositoryMock.findUserByMail.mockResolvedValue(user);
      otpRepositoryMock.getOtp.mockResolvedValue('hashed_otp');
      otpRepositoryMock.deleteOtp.mockResolvedValue(undefined);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      authServiceMock.buildAuthSession.mockResolvedValue({
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        role: Role.USER,
        planExpirationDate: null,
      });

      const result = await service.verifyOtp('test@mail.com', '123456');

      expect(result).toEqual({
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        role: Role.USER,
        planExpirationDate: null,
      });

      expect(otpRepositoryMock.deleteOtp).toHaveBeenCalledWith('test@mail.com');
    });
    it('should throw NotFoundException when OTP is invalid', async () => {
      otpRepositoryMock.findUserByMail.mockResolvedValue({
        id: 1,
        email: 'test@mail.com',
      });

      otpRepositoryMock.getOtp.mockResolvedValue('hashed_otp');

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyOtp('test@mail.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(otpRepositoryMock.deleteOtp).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on error', async () => {
      otpRepositoryMock.findUserByMail.mockRejectedValue(new Error('DB error'));

      await expect(service.verifyOtp('test@mail.com', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });
    describe('resolveBcryptRounds', () => {
      it('should return config value when valid', () => {
        configServiceMock.get.mockReturnValue('12');

        // @ts-expect-error accessing private method
        const rounds = service.resolveBcryptRounds();

        expect(rounds).toBe(12);
      });

      it('should fallback to 10 when invalid', () => {
        configServiceMock.get.mockReturnValue('invalid');

        // @ts-expect-error accessing private method
        const rounds = service.resolveBcryptRounds();

        expect(rounds).toBe(10);
      });
    });
  });
});
