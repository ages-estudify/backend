import { ApiProperty } from '@nestjs/swagger';

export class AttemptDayResultAlternativeDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'A' })
  letter!: string;

  @ApiProperty()
  text!: string;
}

export class AttemptDayResultQuestionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty()
  text!: string;

  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;

  @ApiProperty({ type: [AttemptDayResultAlternativeDto] })
  alternatives!: AttemptDayResultAlternativeDto[];

  @ApiProperty({ nullable: true, format: 'uuid' })
  selectedAlternativeId!: string | null;

  @ApiProperty({ format: 'uuid' })
  correctAlternativeId!: string;

  @ApiProperty()
  feedback!: string;
}

export class AttemptDayResultDataDto {
  @ApiProperty({ format: 'uuid' })
  attemptDayId!: string;

  @ApiProperty({ format: 'uuid' })
  attemptId!: string;

  @ApiProperty({ format: 'uuid' })
  examId!: string;

  @ApiProperty({ format: 'uuid' })
  examDayId!: string;

  @ApiProperty({ example: 'Simulado ENEM - Novembro 2024' })
  name!: string;

  @ApiProperty({ example: 1 })
  day!: number;

  @ApiProperty({ example: 90 })
  timeSpentMinutes!: number;

  @ApiProperty({ example: '2026-03-12T18:32:10.000Z' })
  endTime!: string;

  @ApiProperty({ example: 45 })
  totalQuestions!: number;

  @ApiProperty({ example: 40 })
  answeredQuestions!: number;

  @ApiProperty({ example: 33 })
  correctAnswers!: number;

  @ApiProperty({ example: 7 })
  wrongAnswers!: number;

  @ApiProperty({ example: 5 })
  blankAnswers!: number;

  @ApiProperty({ type: [AttemptDayResultQuestionDto] })
  questions!: AttemptDayResultQuestionDto[];
}

export class AttemptDayResultResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: AttemptDayResultDataDto })
  data!: AttemptDayResultDataDto;
}
