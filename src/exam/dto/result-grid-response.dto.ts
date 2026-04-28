import { ApiProperty } from '@nestjs/swagger';

export type ResultGridItemStatus = 'CORRECT' | 'WRONG' | 'BLANK';

export class ResultGridItemDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador da questão',
  })
  questionId!: string;

  @ApiProperty({
    example: 1,
    description:
      'Posição da questão no array geral sem filtro. Esse número não muda quando o filtro é aplicado.',
  })
  number!: number;

  @ApiProperty({
    enum: ['CORRECT', 'WRONG', 'BLANK'],
    example: 'CORRECT',
    description: 'Status da resposta da questão.',
  })
  status!: ResultGridItemStatus;
}

export class ResultGridDataDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador da tentativa',
  })
  attemptId!: string;

  @ApiProperty({
    example: 90,
    description: 'Total de questões da tentativa sem filtro.',
  })
  totalQuestions!: number;

  @ApiProperty({
    type: [ResultGridItemDto],
    description: 'Grade de resultados da tentativa.',
  })
  grid!: ResultGridItemDto[];
}

export class ResultGridSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ type: ResultGridDataDto })
  data!: ResultGridDataDto;
}
