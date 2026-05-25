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
} from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ListExamsResponseDto, UpdateExamRequestDto, UpdateExamResponseDto } from './dto';
import type { MulterFile } from '../common/types/multer-file';

@ApiTags('Exams (Admin)')
@ApiBearerAuth('JWT-auth')
@Controller('admin/exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADM)
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Get()
  @ApiResponse({ status: 200, type: ListExamsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not ADM' })
  async listAllExams(): Promise<ListExamsResponseDto> {
    return this.examsService.listAllExams();
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import exam from CSV',
    description: 'Uploads a CSV file to create an exam with questions, alternatives and exam days.',
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file (max 10MB, max 180 questions)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: `CSV with the following columns:

exam_title,bank,exam_day,discipline,content,question,
alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,
correct_answer,answer_explanation,year

Rules:
- exam_title and bank must be consistent across all rows
- exam_day must be a positive integer
- correct_answer must be A, B, C, D or E
- All alternatives (A-E) are required
- discipline and content must exist in the system
- Max 180 questions
- Avoid commas inside fields (simple CSV parser)
`,
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Exam imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CSV or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not ADM' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async importExamFromCsv(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.examsService.importExamFromCsv(file);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update exam',
    description:
      'Updates exam data. Optional image field accepts base64 (raw or data URI). Required to publish if no cover exists.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: UpdateExamResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Bad request (invalid data, publish without image, invalid status)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not ADM' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async updateExam(@Param('id') id: string, @Body() body: UpdateExamRequestDto) {
    return this.examsService.updateExam(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Exam deleted (logical soft delete)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not ADM' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async deleteExam(@Param('id') id: string): Promise<void> {
    await this.examsService.deleteExamLogical(id);
  }
}
