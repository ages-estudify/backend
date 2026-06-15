import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;

  const sendMailMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send OTP email', async () => {
    sendMailMock.mockResolvedValue({});

    process.env.SMTP_FROM = 'noreply@test.com';

    await service.sendOtp('user@test.com', '123456');

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'noreply@test.com',
      to: 'user@test.com',
      subject: 'Seu código de verificação',
      text: 'Seu código é: 123456',
    });
  });

  it('should propagate sendMail errors', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP error'));

    await expect(service.sendOtp('user@test.com', '123456')).rejects.toThrow('SMTP error');
  });
});
