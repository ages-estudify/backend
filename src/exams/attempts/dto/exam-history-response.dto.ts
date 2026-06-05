import { ApiProperty } from '@nestjs/swagger';

export class ExamHistoryExamDto {
  @ApiProperty({ example: 'uuid-exam' })
  id!: string;

  @ApiProperty({ example: 'Novembro 2024' })
  name!: string;

  @ApiProperty({ example: 'ENEM' })
  origin!: string;
}

export class ExamHistorySummaryDto {
  @ApiProperty({ example: 720 })
  averageScore!: number;

  @ApiProperty({ example: 13 })
  totalCompleted!: number;
}

export class ExamHistoryItemDto {
  @ApiProperty({ example: 'uuid-attempt-day' })
  attemptDayId!: string;

  @ApiProperty({ example: 1 })
  day!: number;

  @ApiProperty({ example: 90 })
  totalQuestions!: number;

  @ApiProperty({ example: 82 })
  answeredQuestions!: number;

  @ApiProperty({ example: 65 })
  correctAnswers!: number;

  @ApiProperty({ example: 5400 })
  timeSpentSeconds!: number;

  @ApiProperty({ example: '2025-02-13T16:45:00.000Z' })
  completedAt!: string;
}

export class ExamHistoryDataDto {
  @ApiProperty({ type: ExamHistoryExamDto })
  exam!: ExamHistoryExamDto;

  @ApiProperty({ type: ExamHistorySummaryDto })
  summary!: ExamHistorySummaryDto;

  @ApiProperty({ type: [ExamHistoryItemDto] })
  history!: ExamHistoryItemDto[];
}

export class ExamHistoryResponseDto {
  @ApiProperty({ type: ExamHistoryDataDto })
  data!: ExamHistoryDataDto;
}
