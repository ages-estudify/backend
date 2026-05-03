import { ApiProperty } from '@nestjs/swagger';
import { AttemptDayResultAlternativeDto } from './attempt-day-result-alternative.dto';

export class AttemptDayResultQuestionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty()
  text!: string;

  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;

  @ApiProperty({ type: [AttemptDayResultAlternativeDto] })
  alternatives!: AttemptDayResultAlternativeDto[];

  @ApiProperty({ nullable: true, format: 'uuid' })
  selectedAlternativeId!: string | null;

  @ApiProperty({ format: 'uuid' })
  correctAlternativeId!: string;

  @ApiProperty()
  feedback!: string;
}
