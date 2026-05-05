import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiConsumes,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ListExamsResponseDto, UpdateExamResponseDto } from './dto';
import type { MulterFile } from '../common/types/multer-file';
import { ExamListingWithAttemptsByUserDto } from './dto/examListingWithAttemptsByUser.dto';
import type { JwtAuthUser } from 'src/auth/security/jwt-auth-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResultGridQueryDto, ResultGridStatusFilter } from './dto/result-grid-query.dto';
import { ResultGridSuccessResponseDto } from './dto/result-grid-response.dto';

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
@Controller('api/v1/exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private examsService: ExamsService) { }

  // ✅ USER e ADM podem acessar
  @Get()
  @Roles(Role.USER, Role.ADM)
  @ApiResponse({ status: 200, type: ListExamsResponseDto })
  async listAllExamsForUsers(): Promise<ListExamsResponseDto> {
    return this.examsService.listAllExams();
  }

  // 🔒 SOMENTE ADM
  @Post('import')
  @Roles(Role.ADM)
  @UseInterceptors(FileInterceptor('file'))
  async importExamFromCsv(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.examsService.importExamFromCsv(file);
  }

  // 🔒 SOMENTE ADM
  @Put(':id')
  @Roles(Role.ADM)
  @UseInterceptors(FileInterceptor('image'))
  async updateExam(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() image?: MulterFile,
  ) {
    const updates = {
      title: body.title,
      origin: body.origin,
      image: image,
      status: body.status,
    };

    return this.examsService.updateExam(id, updates);
  }

  // 🔒 SOMENTE ADM
  @Delete(':id')
  @Roles(Role.ADM)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExam(@Param('id') id: string): Promise<void> {
    await this.examsService.deleteExamLogical(id);
  }

  // ✅ USER e ADM
  @Get('user')
  @Roles(Role.USER, Role.ADM)
  async examListingWithAttemptsByUser(
    @CurrentUser() user: JwtAuthUser,
  ): Promise<ExamListingWithAttemptsByUserDto> {
    return this.examsService.findAllWithLastAttemptByUser(user.userId);
  }

  // ✅ USER e ADM
  @Get(':attemptId/resultGrid')
  @Roles(Role.USER, Role.ADM)
  async resultGrid(
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Query() query: ResultGridQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResultGridSuccessResponseDto> {
    const userId =
      req.user.userId ??
      req.user.id ??
      req.user.sub ??
      req.user.user_id;

    if (!userId) {
      throw new UnauthorizedException('User not found in token');
    }

    return this.examsService.getResultGrid(attemptId, userId, query);
  }
}