import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateScheduleItemDto {
  @ApiProperty({ description: 'Indica se o item está concluído' })
  @IsBoolean()
  @IsNotEmpty()
  completed!: boolean;
}
