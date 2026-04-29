import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user: {
    userId?: string;
    id?: string;
    sub?: string;
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

  @Post(':attemptId/resultGrid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Attempt result grid',
  })
  @ApiBody({
    type: ResultGridQueryDto,
    required: false,
  })
  @ApiOkResponse({ type: ResultGridSuccessResponseDto })
  @ApiNotFoundResponse({
    description: 'Attempt not found or invalid id',
    schema: { example: { success: false, message: 'Attempt not found' } },
  })
  async resultGrid(
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Body() query: ResultGridQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResultGridSuccessResponseDto> {
    const userId = req.user.userId ?? req.user.id ?? req.user.sub;

    if (!userId) {
      throw new UnauthorizedException('User not found in token');
    }

    return this.examService.getResultGrid(attemptId, userId, query);
  }
}
