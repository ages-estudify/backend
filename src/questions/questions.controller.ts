import {
  Controller,
  HttpCode,
  Post,
  Get,
  HttpStatus,
  Param,
  Query,
  UseGuards,
  Body,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuestionsService } from './questions.service';
import { QuestionBatchDataDto } from './dto/question-batch.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { AnswerSuccessResponseDto } from './dto/answer-response.dto';
import { SubscriptionGuard } from 'src/auth/guards/subscription.guard';

@ApiTags('questions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
@Controller({ path: 'questions', version: '1' })
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get(':topicId')
  @ApiOperation({ summary: 'Get a batch of questions by topic' })
  @ApiResponse({ status: 200, description: 'Questions batch', type: QuestionBatchDataDto })
  @ApiBadRequestResponse({ description: 'Invalid type or limit' })
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async getQuestionBatch(
    @Param('topicId') topicId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('type') type: string,
    @Query('limit') limit?: string,
    @Query('excludeAnswered') excludeAnswered?: string,
    @Query('retrieveWrong') retrieveWrong?: string,
  ): Promise<QuestionBatchDataDto> {
    if (!type || !['ORIGINAL', 'SIMPLIFIED'].includes(type)) {
      throw new BadRequestException('Tipo de questão inválido');
    }

    const limitNum = limit ? parseInt(limit, 10) : 10;
    if (limitNum < 1 || limitNum > 20) {
      throw new BadRequestException('Limite inválido');
    }

    const exclude = excludeAnswered !== 'false'; // default true
    const retrieveWrongParam = retrieveWrong !== 'false'; // default true

    return this.questionsService.getQuestionBatch(
      topicId,
      type,
      limitNum,
      exclude,
      retrieveWrongParam,
      user.userId,
    );
  }

  @Post(':questionId/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Answer a question and get feedback' })
  @ApiOkResponse({ type: AnswerSuccessResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid selected answer',
    schema: {
      example: { success: false, message: 'Question has no correct answer defined' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Question not found',
    schema: {
      example: { success: false, message: 'Question not found' },
    },
  })
  async questionFeedback(
    @Param('questionId', new ParseUUIDPipe({ version: '4' })) questionId: string,
    @Body() body: AnswerQuestionDto,
    @CurrentUser() user: JwtAuthUser,
  ): Promise<AnswerSuccessResponseDto> {
    const result = await this.questionsService.questionFeedback(
      questionId,
      user.userId,
      body.selectedAnswer,
    );
    return result;
  }
}
