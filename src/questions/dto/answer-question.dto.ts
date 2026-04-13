import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SelectedAnswer {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
}

export class AnswerQuestionDto {
  @ApiProperty({
    description: 'Selected answer letter',
    enum: SelectedAnswer,
    example: 'A',
  })
  @IsEnum(SelectedAnswer, { message: 'Selected answer must be A, B, C, D, or E' })
  @IsNotEmpty()
  selectedAnswer!: SelectedAnswer;
}
