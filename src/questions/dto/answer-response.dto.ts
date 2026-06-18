import { ApiProperty } from '@nestjs/swagger';

export class AnswerResponseDto {
  @ApiProperty({
    description: 'Whether the answer is correct',
    example: true,
  })
  isCorrect!: boolean;

  @ApiProperty({
    description: 'The correct answer letter',
    example: 'A',
  })
  correctAnswer!: string;

  @ApiProperty({
    description: 'Explanation for the correct answer',
    example: 'This is the explanation for why A is correct.',
  })
  explanation!: string;

  @ApiProperty({
    description: 'Coins earned in this answer',
    example: 1,
  })
  coinsEarned!: number;

  @ApiProperty({
    description: 'Total coins after this answer',
    example: 47,
  })
  totalCoins!: number;

  @ApiProperty({
    description: 'Quantidade de dias consecutivos do streak do usuario',
    example: 8,
  })
  streakDays!: number;

  @ApiProperty({
    description: 'Indica se o usuario ja manteve o streak hoje',
    example: true,
  })
  streakActive!: boolean;
}

export class AnswerSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: AnswerResponseDto, required: false })
  data?: AnswerResponseDto | { saved: boolean };
}
