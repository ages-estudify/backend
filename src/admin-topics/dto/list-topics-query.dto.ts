import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class ListTopicsQueryDto {
  @ApiPropertyOptional({ description: 'Filter topics by subject id' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by enabled status. Defaults to "true" (active topics) when omitted.',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  enable?: 'true' | 'false';
}
