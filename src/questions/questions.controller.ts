import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { AnswerSuccessResponseDto } from './dto/answer-response.dto';
import { JwtAuthGuard } from './security/jwt-auth.guard';
import { JwtUserClaims } from '../auth/security/jwt-claims';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post(':questionId/answer')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Answer a question and get feedback' })
  @ApiCreatedResponse({ type: AnswerSuccessResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid selected answer',
    schema: {
      example: { success: false, message: 'Question has no correct answer defined' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    schema: {
      example: { success: false, message: 'Invalid token' },
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
    @Req() req: { user: JwtUserClaims },
  ): Promise<AnswerSuccessResponseDto> {
    const result = await this.questionsService.questionFeedback(
      questionId,
      req.user.userId,
      body.selectedAnswer,
    );
    return result;
  }
}
