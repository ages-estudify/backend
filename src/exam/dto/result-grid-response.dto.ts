import { ApiProperty } from '@nestjs/swagger';

/** Uso interno (filtro / regra de negócio). */
export type ResultGridItemStatus = 'CORRECT' | 'WRONG' | 'BLANK';

/** Resultado da resposta na prova (português). */
export type ResultadoQuestao = 'CERTO' | 'ERRADO' | 'VAZIO';

export class ResultGridItemDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador da questão' })
  questionId!: string;

  @ApiProperty({
    description:
      'Posição fixa na grelha completa da tentativa (1 … totalQuestions), pela mesma ordem devolvida sem filtro. Não muda quando aplica `statusFilter`.',
    example: 12,
  })
  number!: number;

  @ApiProperty({ enum: ['CERTO', 'ERRADO', 'VAZIO'], description: 'Certo, errado ou vazio (sem resposta).' })
  resultado!: ResultadoQuestao;

  @ApiProperty({ nullable: true, example: 'A', description: 'Alternativa escolhida (null se vazio)' })
  selectedAnswer!: string | null;

  @ApiProperty({ nullable: true, example: 'A', description: 'Alternativa correta' })
  correctAnswer!: string | null;
}

export class ResultGridDataDto {
  @ApiProperty({ format: 'uuid' })
  attemptId!: string;

  @ApiProperty({ example: 90 })
  totalQuestions!: number;

  @ApiProperty({ type: [ResultGridItemDto] })
  grid!: ResultGridItemDto[];
}

export class ResultGridSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ type: ResultGridDataDto })
  data!: ResultGridDataDto;
}
