import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { AnswerSuccessResponseDto } from './dto/answer-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Questions')
@Controller('questions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  schema: { example: { success: false, message: 'Missing or invalid JWT' } },
})
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

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
