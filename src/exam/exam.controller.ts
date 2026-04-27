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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResultGridQueryDto } from './dto/result-grid-query.dto';
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
  constructor(private readonly examService: ExamService) {}

  @Post(':attemptId/resultGrid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Grade de resultados da tentativa',
    description:
      'Requer utilizador autenticado (Bearer). `attemptId` pode ser o id da **Attempt** ou de um **AttemptDay**. Filtro opcional: query `statusFilter` (repetir para vários valores). No Swagger, usa **Authorize** com o access token do login.',
  })
  @ApiOkResponse({ type: ResultGridSuccessResponseDto })
  @ApiNotFoundResponse({
    description: 'Tentativa inexistente ou id inválido',
    schema: { example: { success: false, message: 'Tentativa não encontrada' } },
  })
  async resultGrid(
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Query() query: ResultGridQueryDto,
  ): Promise<ResultGridSuccessResponseDto> {
    return this.examService.getResultGrid(attemptId, query);
  }
}