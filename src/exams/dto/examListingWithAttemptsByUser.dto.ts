import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  IsUUID,
  ValidateNested,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProgressDto {
  @ApiProperty({ example: 34 })
  @IsInt()
  answered!: number;

  @ApiProperty({ example: 75 })
  @IsInt()
  total!: number;

  @ApiProperty({ example: 45.33 })
  @IsNumber()
  percentage!: number;
}

export class DayDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  examDayId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  day!: number;

  @ApiProperty({ example: 75 })
  @IsInt()
  totalQuestions!: number;

  @ApiProperty({ example: 34 })
  @IsInt()
  answeredQuestions!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCompleted!: boolean;

  @ApiProperty({
    example: 'in_progress',
    enum: ['completed', 'in_progress', 'available'],
    description:
      'Day status. Computed from the user attempt: completed when finished, in_progress when started, available otherwise.',
  })
  @IsString()
  @IsIn(['completed', 'in_progress', 'available'])
  status!: 'completed' | 'in_progress' | 'available';

  @ApiProperty({
    example: true,
    description: 'True when this day has questions with a language variant (e.g. ENEM day 1).',
  })
  @IsBoolean()
  hasLanguageChoice!: boolean;
}

export class ExamDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'Simulado ENEM - Ciências Humanas' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 45 })
  @IsInt()
  totalQuestions!: number;

  @ApiProperty({ example: 'ENEM' })
  @IsString()
  origin!: string;

  @ApiProperty({
    example: 'completed',
    enum: ['completed', 'in_progress', 'available'],
  })
  @IsString()
  @IsIn(['completed', 'in_progress', 'available'])
  status!: 'completed' | 'in_progress' | 'available';

  @ApiProperty({ example: 0 })
  @IsInt()
  answeredQuestions!: number;

  @ApiProperty({ type: ProgressDto })
  @ValidateNested()
  @Type(() => ProgressDto)
  progress!: ProgressDto;

  @ApiProperty({ example: 'https://cdn.com/image.png' })
  @IsString()
  image_url!: string;

  @ApiProperty({
    example: true,
    description: 'True when at least one day of the exam has a language choice.',
  })
  @IsBoolean()
  hasLanguageChoice!: boolean;

  @ApiProperty({ type: [DayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayDto)
  days!: DayDto[];
}

export class ExamListingWithAttemptsByUserDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({ type: [ExamDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamDto)
  data!: ExamDto[];
}
