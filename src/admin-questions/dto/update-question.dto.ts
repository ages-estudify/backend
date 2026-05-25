import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsUUID,
  IsOptional,
  IsEnum,
  ValidateNested,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdminQuestionType, AlternativesObjectDto } from './create-question.dto';

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  discipline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  question?: string;

  @ApiPropertyOptional({ type: AlternativesObjectDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlternativesObjectDto)
  alternatives?: AlternativesObjectDto;

  @ApiPropertyOptional({ example: 'B' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1)
  correctAnswer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  answerExplanation?: string;

  @ApiPropertyOptional({ enum: AdminQuestionType })
  @IsOptional()
  @IsEnum(AdminQuestionType)
  type?: AdminQuestionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Mock exam id, or null to remove association.',
  })
  @IsOptional()
  @IsUUID()
  mockExamId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  bank?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pathId?: string;

  @ApiPropertyOptional({ description: 'Soft-delete / re-enable flag' })
  @IsOptional()
  @IsBoolean()
  enable?: boolean;

  @ApiPropertyOptional({
    description: 'Question image as base64 (raw or data URI). Replaces existing image when sent.',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
