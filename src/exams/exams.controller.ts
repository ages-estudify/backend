import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';

import { ExamService } from './exams.service';
import { ExamListingWithAttemptsByUserDto } from './dto/examListingWithAttemptsByUser.dto';

@ApiTags('exams')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller({ path: 'exams', version: '1' })
export class ExamsController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  @ApiOkResponse({
    description: 'Lista de exames do usuário com progresso',
    type: ExamListingWithAttemptsByUserDto,
  })
  async examListingWithAttemptsByUser(
    @CurrentUser() user: JwtAuthUser,
  ): Promise<ExamListingWithAttemptsByUserDto> {
    return this.examService.findAllWithLastAttemptByUser(user.userId);
  }
}