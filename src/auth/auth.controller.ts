import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterSuccessResponseDto } from './dto/register-response.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: RegisterSuccessResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      example: { success: false, message: 'birthDate must be a valid YYYY-MM-DD date' },
    },
  })
  @ApiConflictResponse({
    description: 'Email or phone already registered',
    schema: {
      example: { success: false, message: 'Email is already registered' },
    },
  })
  async register(@Body() body: RegisterRequestDto) {
    const data = await this.auth.register(body);
    return { success: true as const, data };
  }
}
