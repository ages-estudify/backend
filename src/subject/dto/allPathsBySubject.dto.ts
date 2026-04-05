import { ApiProperty } from '@nestjs/swagger';

export class QuestionCountByTypeDto {
  @ApiProperty({ example: 30 })
  ORIGINAL!: number;

  @ApiProperty({ example: 20 })
  EXTERNAL!: number;
}

export class SubjectPathDto {
  @ApiProperty({ example: 'uuid-path-id' })
  id!: string;

  @ApiProperty({ example: 'Álgebra Básica' })
  name!: string;

  @ApiProperty({ example: 'Introdução à álgebra...' })
  text!: string;

  @ApiProperty({ example: 'https://cdn.com/icon.png' })
  icon!: string;

  @ApiProperty({ type: QuestionCountByTypeDto })
  availableByType!: QuestionCountByTypeDto;

  @ApiProperty({ type: QuestionCountByTypeDto })
  answeredByType!: QuestionCountByTypeDto;
}

export class AllSubjectsPathsResponseDto {
  @ApiProperty({ type: [SubjectPathDto] })
  data!: SubjectPathDto[];
}