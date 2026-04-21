import { Controller, Get, Post, Put, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Body, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiParam, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ListExamsResponseDto, UpdateExamResponseDto } from './dto';

@ApiTags('Exams (Admin)')
@ApiBearerAuth('JWT')
@Controller('api/v1/admin/exams')
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
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Exam imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CSV or file too large' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not ADM' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async importExamFromCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10 MB limit');
    }

    return this.examsService.importExamFromCsv(file);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: UpdateExamResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (invalid data, publish without image, status invalid)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not ADM' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async updateExam(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const updates = {
      title: body.title,
      origin: body.origin,
      image: image,
      status: body.status,
    };

    return this.examsService.updateExam(id, updates);
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
