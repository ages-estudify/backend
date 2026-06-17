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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminTopicsService } from './admin-topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
import {
  CreateTopicResponseDto,
  DeleteTopicResponseDto,
  ListTopicsResponseDto,
  UpdateTopicResponseDto,
} from './dto/topic-response.dto';

@ApiTags('Admin Topics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADM)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
@ApiForbiddenResponse({ description: 'Authenticated but not an admin' })
@Controller({ path: 'admin/topics', version: '1' })
export class AdminTopicsController {
  constructor(private readonly service: AdminTopicsService) {}

  @Get()
  @ApiOperation({ summary: 'List learning topics (trilhas)' })
  @ApiOkResponse({ type: ListTopicsResponseDto })
  async findAll(@Query() query: ListTopicsQueryDto) {
    const enable = query.enable === undefined ? true : query.enable === 'true';
    return this.service.findAll(enable, query.subjectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a learning topic (trilha)' })
  @ApiCreatedResponse({ type: CreateTopicResponseDto })
  @ApiConflictResponse({ description: 'Order already used in this subject' })
  async create(@Body() dto: CreateTopicDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a learning topic (trilha)' })
  @ApiOkResponse({ type: UpdateTopicResponseDto })
  @ApiNotFoundResponse({ description: 'Topic not found' })
  @ApiConflictResponse({ description: 'Order already used in this subject' })
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateTopicDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a learning topic (soft delete)' })
  @ApiOkResponse({ type: DeleteTopicResponseDto })
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }
}
