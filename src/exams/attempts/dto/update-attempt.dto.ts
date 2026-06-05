import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

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

  @ApiProperty({
    description: 'When provided to /finish, marks this attempt day as completed and returns its id',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  examDayId?: string;
}
