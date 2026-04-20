import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  ParseUUIDPipe,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from 'src/auth/security/jwt-auth-user';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateAttemptDto } from './dto/update-attempt.dto';

@ApiTags('Attempts')
@ApiBearerAuth()
@Controller({ path: 'exams', version: '1' })
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @ApiOperation({
    summary: 'Start or resume an exam attempt',
  })
  @ApiResponse({
    status: 201,
    description: 'Attempt created or retrieved successfully',
  })
  @Post(':examId/attempts')
  async create(
    @Param('examId', new ParseUUIDPipe({ version: '4' })) examId: string,
    @Body() body: CreateAttemptDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return await this.attemptsService.create(examId, user.userId, body.language);
  }

  @ApiOperation({
    summary: 'Get current active attempt for a specific exam',
  })
  @ApiResponse({
    status: 200,
    description: 'Return attempt or null',
  })
  @Get(':examId/attempts/latest')
  async findLast(
    @Param('examId', new ParseUUIDPipe({ version: '4' })) examId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return await this.attemptsService.findLast(user.userId, examId);
  }

  @ApiOperation({
    summary: 'Pause attempt and upgrade progress',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attempt not found or belongs to another user',
  })
  @ApiResponse({
    status: 400,
    description: 'Attempt already finished',
  })
  @Patch('attempts/:attemptId/pause')
  async pause(
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Body() updateAttemptDto: UpdateAttemptDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return await this.attemptsService.update(attemptId, updateAttemptDto, user.userId);
  }

  @ApiOperation({
    summary: 'Finalize exam and calculate final score',
  })
  @ApiResponse({ status: 201, description: 'Exam finished and score calculated' })
  @Post('attempts/:attemptId/finish') // Mudado de PATCH para POST conforme o PDF
  async finish(
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return await this.attemptsService.finish(attemptId, user.userId);
  }
}
