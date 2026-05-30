import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUrl, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionCountByTypeDto {
  @ApiProperty({ example: 30 })
  @IsNumber()
  ORIGINAL!: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  EXTERNAL!: number;
}

export class SubjectPathDto {
  @ApiProperty({ example: 'uuid-path-id' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'Álgebra Básica' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Introdução à álgebra...' })
  @IsString()
  text!: string;

  @ApiProperty({ example: 'https://cdn.com/icon.png' })
  @IsUrl()
  icon_url!: string;

  @ApiProperty({ type: QuestionCountByTypeDto })
  @ValidateNested()
  @Type(() => QuestionCountByTypeDto)
  availableByType!: QuestionCountByTypeDto;

  @ApiProperty({ type: QuestionCountByTypeDto })
  @ValidateNested()
  @Type(() => QuestionCountByTypeDto)
  answeredByType!: QuestionCountByTypeDto;
}

export class AllSubjectsPathsResponseDto {
  @ApiProperty({ type: [SubjectPathDto] })
  @ValidateNested({ each: true })
  @Type(() => SubjectPathDto)
  data!: SubjectPathDto[];
}
