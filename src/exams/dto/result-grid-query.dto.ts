import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum ResultGridStatusFilter {
  CORRECT = 'CORRECT',
  WRONG = 'WRONG',
  BLANK = 'BLANK',
}

export class ResultGridQueryDto {
  @ApiPropertyOptional({
    enum: ResultGridStatusFilter,
    isArray: true,
    description: 'Filters questions by status.',
    example: [ResultGridStatusFilter.CORRECT],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  })
  @IsEnum(ResultGridStatusFilter, { each: true })
  statusFilter?: ResultGridStatusFilter[];

  @ApiPropertyOptional({
    description: 'When provided, restricts the grid to questions of this attempt day only.',
  })
  @IsOptional()
  @IsUUID()
  attemptDayId?: string;
}
