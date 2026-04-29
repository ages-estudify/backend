import { ApiProperty } from '@nestjs/swagger';
import { ResultGridItemDto } from './result-grid-item.dto';

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