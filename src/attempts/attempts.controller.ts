import { Controller, Post, Body, ParseUUIDPipe, Param, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtAuthUser } from 'src/auth/security/jwt-auth-user';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller({ path: 'exams', version: '1' })
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post(':examId/attempts')
  async create(
    @Param('examId', new ParseUUIDPipe({ version: '4' })) examId: string,
    @Body() body: CreateAttemptDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return await this.attemptsService.create(examId, user.userId, body.language);
  }
}
