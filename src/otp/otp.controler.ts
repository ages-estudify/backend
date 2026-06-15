import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { CreateOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { LoginSuccessResponseDto } from '../auth/dto/login-response.dto';

@ApiTags('otp')
@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Gera e envia um OTP para recuperação de senha',
  })
  @ApiBody({ type: CreateOtpDto })
  @ApiResponse({
    status: 200,
    description: 'Solicitação processada com sucesso.',
    schema: {
      example: {
        success: true,
        message: 'Se o e-mail estiver cadastrado, um código foi enviado.',
      },
    },
  })
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
  @ApiOperation({
    summary: 'Valida o OTP e retorna uma sessão autenticada',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP válido.',
    type: LoginSuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'OTP inválido.',
  })
  async verify(@Body() dto: VerifyOtpDto) {
    const data = await this.otpService.verifyOtp(dto.email, dto.otp);

    return { success: true as const, data };
  }
}
