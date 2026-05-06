import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminQuestionsService } from './admin-questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';

@ApiTags('Admin Questions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADM)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
@ApiForbiddenResponse({ description: 'Authenticated but not an admin' })
@Controller({ path: 'admin/questions', version: '1' })
export class AdminQuestionsController {
  constructor(private readonly service: AdminQuestionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a question' })
  @ApiCreatedResponse({ description: 'Question created successfully' })
  async create(@Body() dto: CreateQuestionDto) {
    return this.service.create(dto);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import questions from CSV' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ description: 'CSV import results' })
  @ApiBadRequestResponse({ description: 'CSV file is required or file is not valid CSV' })
  async importCsv(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('CSV file is required');
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    if (
      mime &&
      /^(image\/|video\/|audio\/|application\/pdf|application\/zip|application\/x-zip)/i.test(mime)
    ) {
      throw new BadRequestException(
        'Only CSV uploads are allowed. Do not send images, PDFs, archives, or other binary types.',
      );
    }
    return this.service.importCsv(file.buffer);
  }

  @Get('paths')
  @ApiOperation({ summary: 'List all paths with their subjects' })
  @ApiOkResponse({ description: 'List of paths' })
  async findAllPaths() {
    return this.service.findAllPaths();
  }

  @Get('exams')
  @ApiOperation({ summary: 'List all mock exams' })
  @ApiOkResponse({ description: 'List of exams' })
  async findAllExams() {
    return this.service.findAllExams();
  }

  @Get()
  @ApiOperation({ summary: 'List questions with pagination and filters' })
  @ApiOkResponse({ description: 'Paginated list of questions' })
  async findAll(@Query() query: QueryQuestionsDto) {
    const enableFilter = query.enable === undefined ? undefined : query.enable === 'true';
    return this.service.findAll(query, enableFilter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiOkResponse({ description: 'Question found' })
  @ApiNotFoundResponse({ description: 'Question not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a question' })
  @ApiOkResponse({ description: 'Question updated' })
  @ApiNotFoundResponse({ description: 'Question not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuestionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question (soft delete, enable=false)' })
  @ApiNotFoundResponse({ description: 'Question not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
