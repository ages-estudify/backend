import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTopicDto } from './create-topic.dto';

export class UpdateTopicDto extends PartialType(CreateTopicDto) {
  @ApiPropertyOptional({ description: 'Soft-delete / re-enable flag' })
  @IsOptional()
  @IsBoolean()
  enable?: boolean;
}
