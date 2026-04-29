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
