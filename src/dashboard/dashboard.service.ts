import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  getDashboard(): Promise<DashboardResponseDto> {
    throw new Error('Not implemented');
  }
}
