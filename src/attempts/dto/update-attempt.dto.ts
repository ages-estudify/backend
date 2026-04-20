import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateAttemptDto {
  @ApiProperty({
    description: 'Current question number',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  current_question?: number;

  @ApiProperty({
    description: 'Total time spent in minutes',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  time_spent_minutes?: number;
}
