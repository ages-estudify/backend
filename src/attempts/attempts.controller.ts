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
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
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
    summary: 'Get current active attempt',
  })
  @ApiResponse({
    status: 200,
    description: 'Return attempt or null',
  })
  @Get('attempts/last')
  async findLast(@CurrentUser() user: JwtAuthUser) {
    return await this.attemptsService.findLast(user.userId);
  }

  @ApiOperation({
    summary: 'Update progress (question and time)',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress updated successfully',
  })
  @Patch('attempts/:id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateAttemptDto: UpdateAttemptDto,
  ) {
    return await this.attemptsService.update(id, updateAttemptDto);
  }

  @ApiOperation({
    summary: 'Finalize exam and calculate final score',
  })
  @ApiResponse({
    status: 200,
    description: 'Exam finished and score calculated',
  })
  @Patch('attempts/:id/finish')
  async finish(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return await this.attemptsService.finish(id);
  }
}
