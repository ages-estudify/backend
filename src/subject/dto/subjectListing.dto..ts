import { ApiProperty } from '@nestjs/swagger';

export class SubjectListingDto {
  @ApiProperty({ example: 'uuid-subject-id' })
  id!: string;

  @ApiProperty({ example: 'Matemática' })
  name!: string;

  @ApiProperty({ example: 'https://cdn.com/icon.png' })
  icon!: string;

  @ApiProperty({ example: 120 })
  totalQuestions!: number;

  @ApiProperty({ example: 45 })
  answeredQuestions!: number;
}

export class SubjectListingResponseDto {
  @ApiProperty({ type: [SubjectListingDto] })
  data!: SubjectListingDto[];
}