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
}

export class AnswerSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: AnswerResponseDto })
  data!: AnswerResponseDto;
}
