import { Controller, Post, Get, Body, ParseUUIDPipe, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../../auth/security/jwt-auth-user';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateAttemptDto } from './dto/update-attempt.dto';

@ApiTags('Exams')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'exams', version: '1' })
@UseGuards(JwtAuthGuard)
export class AttemptExamsController {
  constructor(private readonly attemptsService: AttemptsService) { }

  @ApiOperation({
    summary: 'Start an exam attempt',
  })
  @ApiResponse({
    status: 201,
    description: 'Attempt created or finalize previous attempt and create a new Attempt',
  })
  @Post(':examId/attempts')
  async create(
    @Param('examId', new ParseUUIDPipe({ version: '4' })) examId: string,
    @Body() body: CreateAttemptDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return await this.attemptsService.create(examId, user.userId, body.language);
  }

  @ApiOperation({
    summary: 'Get current active attempt for a specific exam',
  })
  @ApiResponse({
    status: 200,
    description: 'Return attempt or null',
  })
  @Get(':examId/attempts/latest')
  async findLast(
    @Param('examId', new ParseUUIDPipe({ version: '4' })) examId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return await this.attemptsService.findLast(user.userId, examId);
  }

  @ApiResponse({
    status: 404,
    description: 'Attempt not found or belongs to another user',
  })
  @ApiResponse({
    status: 400,
    description: 'Attempt already finished',
  })
  @ApiOperation({
    summary: 'Finalize exam and calculate final score',
  })
  @ApiResponse({ status: 200, description: 'Exam finished and score calculated' })
  @Post('attempts/:attemptId/finish')
  async finish(
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Body() body: UpdateAttemptDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    if (body.timeSpentSeconds !== undefined) {
      await this.attemptsService.update(attemptId, body, user.userId);
    }
    return await this.attemptsService.finish(attemptId, user.userId);
  }
}
