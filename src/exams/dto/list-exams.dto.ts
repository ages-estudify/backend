import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExamDayDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  day!: number;

  @ApiProperty({ example: 90 })
  @IsInt()
  @Min(1)
  totalQuestions!: number;
}

export class ListExamItemDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'Simulado ENEM - Novembro 2024' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'ENEM' })
  @IsString()
  origin!: string;

  @ApiProperty({ example: 'https://cdn.example.com/enem-logo.png', nullable: true })
  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;

  @ApiProperty({ example: 180 })
  @IsInt()
  @Min(0)
  totalQuestions!: number;

  @ApiProperty({ example: 'PUBLISHED', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status!: string;

  @ApiProperty({ type: [ExamDayDto] })
  @ValidateNested({ each: true })
  @Type(() => ExamDayDto)
  days!: ExamDayDto[];
}

export class ListExamsResponseDto {
  @ApiProperty({ type: [ListExamItemDto] })
  @ValidateNested({ each: true })
  @Type(() => ListExamItemDto)
  data!: ListExamItemDto[];
}