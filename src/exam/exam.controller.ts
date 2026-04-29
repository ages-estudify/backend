import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { ExamListingWithAttemptsByUserDto } from './dto/examListingWithAttemptsByUser.dto';

@Controller('exams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
export class ExamController {
  constructor(private readonly examservice: ExamService) {}

  @Get()
  @ApiOkResponse({
    description: 'Lista de exames do usuário com progresso ',
    type: ExamListingWithAttemptsByUserDto,
  })
  async examListingWithAttemptsByUser(
    @CurrentUser() user: JwtAuthUser,
  ): Promise<ExamListingWithAttemptsByUserDto> {
    return this.examservice.findAllWithLastAttemptByUser(user.userId);
  }
}
