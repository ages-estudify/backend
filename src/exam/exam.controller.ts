import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResultGridQueryDto, ResultGridStatusFilter } from './dto/result-grid-query.dto';
import { ResultGridSuccessResponseDto } from './dto/result-grid-response.dto';
import { ExamService } from './exam.service';

@ApiTags('exam')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
@Controller({ path: 'exam', version: VERSION_NEUTRAL })
export class ExamController {
  constructor(private readonly examService: ExamService) { }

  @Post(':attemptId/resultGrid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Attempt result grid',
  })
  @ApiQuery({
    name: 'statusFilter',
    required: false,
    enum: ResultGridStatusFilter,
    isArray: true,
    description: 'Filters questions by status.',
    example: [ResultGridStatusFilter.CORRECT],
  })
  @ApiOkResponse({ type: ResultGridSuccessResponseDto })
  @ApiNotFoundResponse({
    description: 'Attempt not found or invalid id',
    schema: { example: { success: false, message: 'Attempt not found' } },
  })
  async resultGrid(
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Query() query: ResultGridQueryDto,
  ): Promise<ResultGridSuccessResponseDto> {
    return this.examService.getResultGrid(attemptId, query);
  }
}
