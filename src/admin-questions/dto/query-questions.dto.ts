import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Origin } from '@prisma/client';

export class QueryQuestionsDto {
  @ApiPropertyOptional({ example: 'uuid-path-id' })
  @IsOptional()
  @IsUUID()
  path_id?: string;

  @ApiPropertyOptional({ example: 'uuid-exam-id' })
  @IsOptional()
  @IsUUID()
  exam_id?: string;

  @ApiPropertyOptional({ enum: Origin })
  @IsOptional()
  @IsString()
  origin?: Origin;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;
}
