import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { ScheduleService } from './schedule.service';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { UpdateScheduleItemDto } from './dto/update-schedule-item.dto';

@ApiTags('schedule')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller({ path: 'schedule', version: '1' })
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Gera o ciclo inicial de cronograma após onboarding' })
  @ApiResponse({ status: 201, description: 'Cronograma gerado com sucesso' })
  @ApiResponse({ status: 200, description: 'Cronograma já existente' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Assinatura necessária' })
  @ApiResponse({ status: 409, description: 'Onboarding não concluído' })
  @ApiResponse({ status: 422, description: 'Defina ao menos uma janela de estudo' })
  async createSchedule(
    @CurrentUser() user: JwtAuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.scheduleService.createInitialSchedule(user.userId);
    if (result.generatedItems > 0) {
      res.status(HttpStatus.CREATED);
    }
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Retorna a visualização semanal do cronograma' })
  @ApiQuery({
    name: 'weekStart',
    required: true,
    description: 'Data de início da semana no formato YYYY-MM-DD',
  })
  @ApiResponse({ status: 200, description: 'Semana retornada com sucesso' })
  @ApiResponse({ status: 400, description: 'Parâmetro weekStart inválido' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Assinatura necessária' })
  async getWeekSchedule(@CurrentUser() user: JwtAuthUser, @Query() query: ScheduleQueryDto) {
    const result = await this.scheduleService.getWeekSchedule(user.userId, query.weekStart);
    return { data: result };
  }

  @Patch('items/:itemId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca ou desmarca um item do cronograma como concluído' })
  @ApiResponse({ status: 200, description: 'Item atualizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Assinatura necessária' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async completeScheduleItem(
    @CurrentUser() user: JwtAuthUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateScheduleItemDto,
  ) {
    const result = await this.scheduleService.setScheduleItemCompleted(
      user.userId,
      itemId,
      dto.completed,
    );
    return { data: result };
  }
}
