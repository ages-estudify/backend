import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AdminQuestionType {
  SIMPLIFIED = 'SIMPLIFIED',
  ORIGINAL = 'ORIGINAL',
}

export class AlternativesObjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  A!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  B!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  C!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  D!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  E!: string;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @MinLength(1)
  discipline!: string;

  @ApiProperty({ example: 'Plane geometry' })
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiProperty({ example: 'What is the area of a square with side 4?' })
  @IsString()
  @MinLength(1)
  question!: string;

  @ApiProperty({ type: AlternativesObjectDto })
  @ValidateNested()
  @Type(() => AlternativesObjectDto)
  alternatives!: AlternativesObjectDto;

  @ApiProperty({ example: 'B', description: 'Letter A-E' })
  @IsString()
  @MinLength(1)
  @MaxLength(1)
  correctAnswer!: string;

  @ApiProperty({ example: 'The area of a square is side times side.' })
  @IsString()
  @MinLength(1)
  answerExplanation!: string;

  @ApiProperty({ enum: AdminQuestionType })
  @IsEnum(AdminQuestionType)
  type!: AdminQuestionType;

  @ApiProperty({ example: 2019 })
  @IsInt()
  year!: number;

  @ApiPropertyOptional({
    description:
      'Links to a mock exam (Exam). If omitted, the question is in the general bank only.',
  })
  @IsOptional()
  @IsUUID()
  mockExamId?: string;

  @ApiPropertyOptional({ example: 'ENEM' })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({
    description: 'Curriculum path id. If omitted, the first path by schedule order is used.',
  })
  @IsOptional()
  @IsUUID()
  pathId?: string;

  @ApiPropertyOptional({
    description: 'Question image as base64 (raw or data URI, e.g. data:image/png;base64,...)',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 12, description: 'Question order within exam or trail' })
  @IsOptional()
  @IsInt()
  number?: number;
}
