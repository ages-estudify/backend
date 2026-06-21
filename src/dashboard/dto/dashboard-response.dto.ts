import { ApiProperty } from '@nestjs/swagger';

export class DashboardUsersDto {
  @ApiProperty({ example: 1234 }) active: number;
  @ApiProperty({ example: 132 }) inactive: number;
  @ApiProperty({ example: 14 }) newThisMonth: number;
}

export class DashboardExamsDto {
  @ApiProperty({ example: 14 }) total: number;
  @ApiProperty({ example: 12 }) published: number;
  @ApiProperty({ example: 2 }) draft: number;
  @ApiProperty({ example: 0 }) archived: number;
}

export class DashboardQuestionsDto {
  @ApiProperty({ example: 152 }) total: number;
}

export class EngagementWindowDto {
  @ApiProperty({ example: 80 }) count: number;
  @ApiProperty({ example: 6 }) percentage: number;
}

export class DashboardEngagementDto {
  @ApiProperty({ example: 1366 }) totalUsers: number;
  @ApiProperty({ type: () => EngagementWindowDto }) last7Days: EngagementWindowDto;
  @ApiProperty({ type: () => EngagementWindowDto }) last30Days: EngagementWindowDto;
}

export class PlanCountDto {
  @ApiProperty({ example: 40 }) count: number;
  @ApiProperty({ example: 3 }) percentage: number;
}

export class DashboardPlansDto {
  @ApiProperty({ type: () => PlanCountDto }) trimestral: PlanCountDto;
  @ApiProperty({ type: () => PlanCountDto }) anual: PlanCountDto;
  @ApiProperty({ type: () => PlanCountDto }) none: PlanCountDto;
}

export class ExamUsageWeekDto {
  @ApiProperty({ example: '2026-04-20' }) weekStart: string;
  @ApiProperty({ example: 8200 }) averageTimeSeconds: number;
}

export class DashboardExamUsageDto {
  @ApiProperty({ example: 9480 }) averageTimeSeconds: number;
  @ApiProperty({ type: () => [ExamUsageWeekDto] }) series: ExamUsageWeekDto[];
}

export class DashboardSubjectDto {
  @ApiProperty({ example: 'Química' }) subject: string;
  @ApiProperty({ example: 92 }) questionCount: number;
  @ApiProperty({ example: 1840 }) answerCount: number;
  @ApiProperty({ example: '2026-06-09T14:32:00.000Z', nullable: true })
  lastUpdated: string | null;
}

export class DashboardDataDto {
  @ApiProperty({ type: () => DashboardUsersDto }) users: DashboardUsersDto;
  @ApiProperty({ type: () => DashboardExamsDto }) exams: DashboardExamsDto;
  @ApiProperty({ type: () => DashboardQuestionsDto }) questions: DashboardQuestionsDto;
  @ApiProperty({ type: () => DashboardEngagementDto }) engagement: DashboardEngagementDto;
  @ApiProperty({ type: () => DashboardPlansDto }) plans: DashboardPlansDto;
  @ApiProperty({ type: () => DashboardExamUsageDto }) examUsage: DashboardExamUsageDto;
  @ApiProperty({ type: () => [DashboardSubjectDto] }) subjects: DashboardSubjectDto[];
}

export class DashboardResponseDto {
  @ApiProperty({ example: true }) success: boolean;
  @ApiProperty({ type: () => DashboardDataDto }) data: DashboardDataDto;
}
