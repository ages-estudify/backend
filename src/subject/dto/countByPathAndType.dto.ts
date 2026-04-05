import { ApiProperty } from '@nestjs/swagger';

export class CountByPathAndTypeDto {
  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 20 })
  answered!: number;
}