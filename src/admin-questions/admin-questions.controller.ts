import {
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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminQuestionsService } from './admin-questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';

@ApiTags('Admin Questions')
@Controller({ path: 'admin/questions', version: '1' })
export class AdminQuestionsController {
  constructor(private readonly service: AdminQuestionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a question' })
  @ApiCreatedResponse({ description: 'Question created successfully' })
  async create(@Body() dto: CreateQuestionDto) {
    const data = await this.service.create(dto);
    return { success: true, data };
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
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    const data = await this.service.importCsv(file.buffer);
    return { success: true, data };
  }

  @Get('paths')
  @ApiOperation({ summary: 'List all paths with their subjects' })
  @ApiOkResponse({ description: 'List of paths' })
  async findAllPaths() {
    const data = await this.service.findAllPaths();
    return { success: true, data };
  }

  @Get('exams')
  @ApiOperation({ summary: 'List all exams' })
  @ApiOkResponse({ description: 'List of exams' })
  async findAllExams() {
    const data = await this.service.findAllExams();
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List questions with pagination and filters' })
  @ApiOkResponse({ description: 'Paginated list of questions' })
  async findAll(@Query() query: QueryQuestionsDto) {
    const data = await this.service.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiOkResponse({ description: 'Question found' })
  @ApiNotFoundResponse({ description: 'Question not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.findOne(id);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a question' })
  @ApiOkResponse({ description: 'Question updated' })
  @ApiNotFoundResponse({ description: 'Question not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuestionDto) {
    const data = await this.service.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question (soft delete)' })
  @ApiNotFoundResponse({ description: 'Question not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
