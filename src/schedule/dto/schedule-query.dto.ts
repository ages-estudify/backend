import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ScheduleQueryDto {
  @ApiProperty({ description: 'Data de início da semana no formato YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Parâmetro weekStart inválido' })
  weekStart!: string;
}
