import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CountByPathAndTypeDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  total!: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  answered!: number;
}
