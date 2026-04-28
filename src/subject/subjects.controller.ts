import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SubjectService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { SubjectListingResponseDto } from './dto/subjectListing.dto.';
import { AllSubjectsPathsResponseDto } from './dto/allPathsBySubject.dto';
import { CountByPathAndTypeDto } from './dto/countByPathAndType.dto';
import { SubscriptionGuard } from 'src/auth/guards/subscription.guard';

@Controller('subjects')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@ApiBearerAuth('JWT-auth')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  @ApiOkResponse({ type: SubjectListingResponseDto })
  async subjectListing(@CurrentUser() user: JwtAuthUser): Promise<SubjectListingResponseDto> {
    return this.subjectService.findAllWithAnsweredByUser(user.userId);
  }

  @Get(':id/topics')
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiOkResponse({ type: AllSubjectsPathsResponseDto })
  async pathsBySubject(
    @Param('id') id: string,
    @CurrentUser() user: JwtAuthUser,
  ): Promise<AllSubjectsPathsResponseDto> {
    return this.subjectService.findAllPathsBySubject(id, user.userId);
  }

  @Get('topics/:topicId/questions/count')
  @ApiOkResponse({ type: CountByPathAndTypeDto })
  @ApiNotFoundResponse({ description: 'Topico não encontrada' })
  @ApiBadRequestResponse({ description: 'Tipo de questão inválido' })
  @ApiQuery({ name: 'type', enum: ['ORIGINAL', 'EXTERNAL'], required: true })
  async countQuestions(
    @Param('topicId') pathId: string,
    @Query('type') type: 'ORIGINAL' | 'EXTERNAL',
    @CurrentUser() user: JwtAuthUser,
  ): Promise<CountByPathAndTypeDto> {
    if (!type || !['ORIGINAL', 'EXTERNAL'].includes(type)) {
      throw new BadRequestException('Tipo de questão inválido');
    }

    return this.subjectService.countByPathAndType(pathId, type, user.userId);
  }
}
