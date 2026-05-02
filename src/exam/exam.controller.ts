import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResultGridQueryDto, ResultGridStatusFilter } from './dto/result-grid-query.dto';
import { ResultGridSuccessResponseDto } from './dto/result-grid-response.dto';
import { ExamService } from './exam.service';

type AuthenticatedRequest = Request & {
  user: {
    userId?: string;
    id?: string;
    sub?: string;
    user_id?: string;
  };
};

@ApiTags('exam')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
@Controller({ path: 'exam', version: '1' })
export class ExamController {
  constructor(private readonly examService: ExamService) {}

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

    return this.examService.getResultGrid(attemptId, userId, query);
  }
}
