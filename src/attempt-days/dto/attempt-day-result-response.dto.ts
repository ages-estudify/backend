import { ApiProperty } from '@nestjs/swagger';
import { AttemptDayResultDataDto } from './attempt-day-result-data.dto';

export class AttemptDayResultResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: AttemptDayResultDataDto })
  data!: AttemptDayResultDataDto;
}
