import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';
import { OnboardingRequestDto } from './dto/onboarding-request.dto';

@ApiTags('Onboarding')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Registra preferências de estudo do usuário' })
  @ApiResponse({ status: 204, description: 'Onboarding concluído com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de onboarding inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async completeOnboarding(
    @CurrentUser() user: JwtAuthUser,
    @Body() dto: OnboardingRequestDto,
  ): Promise<void> {
    await this.onboardingService.completeOnboarding(user.userId, dto);
  }
}
