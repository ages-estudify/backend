import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateAttemptDto {
  @ApiProperty({
    description: 'Current question number',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  currentQuestion?: number;

  @ApiProperty({
    description: 'Total time spent in seconds',
    example: 243,
  })
  @IsNumber()
  @IsOptional()
  timeSpentSeconds?: number;
}
