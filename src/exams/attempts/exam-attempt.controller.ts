import {
  Controller,
  Post,
  Get,
  Body,
  ParseUUIDPipe,
  Param,
  UseGuards,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiOkResponse,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../../auth/security/jwt-auth-user';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateAttemptDto } from './dto/update-attempt.dto';
import { ExamListingWithAttemptsByUserDto } from '../dto/examListingWithAttemptsByUser.dto';
import { ResultGridQueryDto, ResultGridStatusFilter } from '../dto/result-grid-query.dto';
import { ResultGridSuccessResponseDto } from '../dto/result-grid-response.dto';
import { ExamsService } from '../exams.service';
import { ExamHistoryResponseDto } from './dto/exam-history-response.dto';
import { SubscriptionGuard } from '../../auth/guards/subscription.guard';

type AuthenticatedRequest = Request & {
  user: {
    userId?: string;
    id?: string;
    sub?: string;
    user_id?: string;
  };
};

@ApiTags('Exams')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'exams', version: '1' })
@UseGuards(JwtAuthGuard)
export class AttemptExamsController {
  constructor(
    private readonly attemptsService: AttemptsService,
    private readonly examsService: ExamsService,
  ) {}

  @Get()
  @ApiOkResponse({
    description: 'Lista de exames do usuário com progresso',
    type: ExamListingWithAttemptsByUserDto,
  })
  async examListingWithAttemptsByUser(
    @CurrentUser() user: JwtAuthUser,
  ): Promise<ExamListingWithAttemptsByUserDto> {
    return this.examsService.findAllWithLastAttemptByUser(user.userId);
  }

  @Get(':attemptId/resultGrid')
  @ApiOperation({
    summary: 'Attempt result grid',
  })
  @ApiQuery({
    name: 'statusFilter',
    required: false,
    isArray: true,
    enum: ResultGridStatusFilter,
    description: 'Filters questions by status. Repeat the parameter for multiple values.',
  })
  @ApiOkResponse({ type: ResultGridSuccessResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid attempt id',
  })
  @ApiNotFoundResponse({
    description: 'Attempt not found',
    schema: { example: { success: false, message: 'Attempt not found' } },
  })
  async resultGrid(
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Query() query: ResultGridQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResultGridSuccessResponseDto> {
    const userId = req.user.userId ?? req.user.id ?? req.user.sub ?? req.user.user_id;

    if (!userId) {
      throw new UnauthorizedException('User not found in token');
    }

    return this.examsService.getResultGrid(attemptId, userId, query);
  }

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
  @Get(':examId/history')
  @UseGuards(SubscriptionGuard)
  @ApiOperation({ summary: 'Get completed attempt history for a specific exam' })
  @ApiOkResponse({
    description: 'Exam history with summary and completed attempt days',
    type: ExamHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { message: 'Unauthorized' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Subscription required',
    schema: { example: { message: 'Subscription required' } },
  })
  @ApiNotFoundResponse({
    description: 'Exam not found',
    schema: { example: { message: 'Exam not found' } },
  })
  async getExamHistory(
    @Param('examId', new ParseUUIDPipe({ version: '4' })) examId: string,
    @CurrentUser() user: JwtAuthUser,
  ): Promise<ExamHistoryResponseDto> {
    return this.attemptsService.getExamHistory(examId, user.userId);
  }
}
