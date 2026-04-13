import { ApiProperty } from '@nestjs/swagger';

export class QuestionBatchItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ enum: ['ORIGINAL', 'SIMPLIFIED'] })
  origin!: 'ORIGINAL' | 'SIMPLIFIED';

  @ApiProperty({ type: [Object] })
  alternatives!: {
    label: string;
    text: string;
  }[];
}

export class SessionProgressDto {
  @ApiProperty()
  current!: number;

  @ApiProperty()
  total!: number;
}

export class QuestionBatchResponseDto {
  @ApiProperty({ type: [QuestionBatchItemDto] })
  questions!: QuestionBatchItemDto[];

  @ApiProperty({ type: SessionProgressDto })
  sessionProgress!: SessionProgressDto;
}

export class QuestionBatchDataDto {
  @ApiProperty({ type: QuestionBatchResponseDto, nullable: true })
  data!: QuestionBatchResponseDto | null;

  @ApiProperty({ required: false })
  message?: string;
}
