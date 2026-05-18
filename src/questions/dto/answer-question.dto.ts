import { IsEnum, IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
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
  @ApiProperty({
    description: 'ID of the exam attempt',
    required: false,
  })
  @IsOptional()
  @IsString()
  attemptId?: string;
  @ApiProperty({
    description: 'Total time spent in seconds',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;
}
