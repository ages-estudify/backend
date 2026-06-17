import { ApiProperty } from '@nestjs/swagger';

export class TrainingResultResponse {
  totalQuestions!: number;
  correctAnswers!: number;
  wrongAnswers!: number;
}

export class TrainingResultSuccessResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: TrainingResultResponse, required: false })
  data?: TrainingResultResponse;
}
