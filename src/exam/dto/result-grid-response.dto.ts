import { ApiProperty } from '@nestjs/swagger';

export type ResultGridItemStatus = 'CORRECT' | 'WRONG' | 'BLANK';

export class ResultGridItemDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Question identifier.',
  })
  questionId!: string;

  @ApiProperty({
    example: 1,
    description:
      'Question position in the unfiltered array. This number does not change when filters are applied.',
  })
  number!: number;

  @ApiProperty({
    enum: ['CORRECT', 'WRONG', 'BLANK'],
    example: 'CORRECT',
    description: 'Question answer status.',
  })
  status!: ResultGridItemStatus;
}

export class ResultGridDataDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Attempt identifier.',
  })
  attemptId!: string;

  @ApiProperty({
    example: 90,
    description: 'Total number of questions in the attempt before filters are applied.',
  })
  totalQuestions!: number;

  @ApiProperty({
    type: [ResultGridItemDto],
    description: 'Attempt result grid.',
  })
  grid!: ResultGridItemDto[];
}

export class ResultGridSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ type: ResultGridDataDto })
  data!: ResultGridDataDto;
}
