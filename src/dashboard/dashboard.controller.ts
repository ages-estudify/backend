import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADM)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Authenticated but not an admin' })
@Controller({ path: 'admin', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated admin dashboard metrics' })
  @ApiOkResponse({ type: DashboardResponseDto })
  getDashboard(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboard();
  }
}
