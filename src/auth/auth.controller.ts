import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginSuccessResponseDto } from './dto/login-response.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
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

  @Post('register-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new admin user (temporary open endpoint)' })
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
  async registerAdmin(@Body() body: RegisterRequestDto) {
    const data = await this.auth.registerAdmin(body);
    return { success: true as const, data };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiOkResponse({ type: LoginSuccessResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      example: { success: false, message: 'email must be an email' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    schema: {
      example: { success: false, message: 'Invalid credentials' },
    },
  })
  async login(@Body() body: LoginRequestDto) {
    const data = await this.auth.login(body);
    return { success: true as const, data };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue new access token using a refresh token' })
  @ApiOkResponse({ type: LoginSuccessResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      example: {
        success: false,
        message: 'refreshToken must be longer than or equal to 10 characters',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      example: { success: false, message: 'Invalid refresh token' },
    },
  })
  async refresh(@Body() body: RefreshRequestDto) {
    const data = await this.auth.refresh(body);
    return { success: true as const, data };
  }
}
