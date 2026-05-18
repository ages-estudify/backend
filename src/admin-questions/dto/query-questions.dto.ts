import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsUUID, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryQuestionsDto {
  @ApiPropertyOptional({
    description: 'Filter by discipline (case-insensitive substring match)',
  })
  @IsOptional()
  @IsString()
  discipline?: string;

  @ApiPropertyOptional({
    description: 'Filter by topic/content (case-insensitive substring match)',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Filter by question bank (e.g. ENEM)' })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ description: 'Filter by year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'Filter by mock exam id (Exam)' })
  @IsOptional()
  @IsUUID()
  mockExamId?: string;

  @ApiPropertyOptional({
    description:
      'String "true" or "false" to filter by enabled; omit to return both active and soft-deleted',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  enable?: 'true' | 'false';

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Page index (0-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Page size' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;
}
