import { ApiProperty } from '@nestjs/swagger';

export class AttemptDayResultAlternativeDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'A' })
  letter!: string;

  @ApiProperty()
  text!: string;
}
