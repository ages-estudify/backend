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

@ApiTags('Schedule')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller({ path: 'schedule', version: '1' })
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Generate the initial schedule cycle after onboarding' })
  @ApiResponse({ status: 201, description: 'Schedule generated successfully' })
  @ApiResponse({ status: 200, description: 'Schedule already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  @ApiResponse({ status: 409, description: 'Onboarding not completed' })
  @ApiResponse({ status: 422, description: 'Set at least one study window' })
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
  @ApiOperation({ summary: 'Return the weekly schedule view' })
  @ApiQuery({
    name: 'weekStart',
    required: true,
    description: 'Week start date in YYYY-MM-DD format',
  })
  @ApiResponse({ status: 200, description: 'Week returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid weekStart parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  async getWeekSchedule(@CurrentUser() user: JwtAuthUser, @Query() query: ScheduleQueryDto) {
    const result = await this.scheduleService.getWeekSchedule(user.userId, query.weekStart);
    return { data: result };
  }

  @Patch('items/:itemId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark or unmark a schedule item as completed' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  @ApiResponse({ status: 404, description: 'Item not found' })
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
