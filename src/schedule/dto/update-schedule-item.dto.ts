import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateScheduleItemDto {
  @ApiProperty({ description: 'Whether the schedule item is completed' })
  @IsBoolean()
  @IsNotEmpty()
  completed!: boolean;
}
