import { ApiProperty } from '@nestjs/swagger';

export class AttemptResponseDto {
  @ApiProperty({
    example: 'attempt-123',
  })
  id!: string;

  @ApiProperty({
    example: 'exam-456',
  })
  examId!: string;

  @ApiProperty({
    example: 12,
  })
  currentQuestion!: number;

  @ApiProperty({
    example: 540,
  })
  timeSpentSeconds!: number;

  @ApiProperty({
    example: 'ENGLISH',
  })
  language!: string;

  @ApiProperty({
    example: '2026-04-29T10:00:00.000Z',
  })
  initTime!: Date;

  @ApiProperty({
    example: '2026-04-29T11:00:00.000Z',
    nullable: true,
  })
  endTime!: Date | null;
}
