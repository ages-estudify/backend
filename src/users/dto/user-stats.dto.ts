import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OverviewDto {
  @ApiProperty({
    example: 156,
  })
  @IsInt()
  @Min(0)
  totalAnswered: number;

  @ApiProperty({
    example: 42,
  })
  @IsInt()
  @Min(0)
  totalCorrect: number;

  @ApiProperty({
    example: 26.9,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  accuracyPercentage: number;
}

export class LevelDto {
  @ApiProperty({
    example: 6,
  })
  @IsInt()
  @Min(0)
  current: number;

  @ApiProperty({
    example: 10,
  })
  @IsInt()
  @Min(0)
  max: number;
}

export class CompletedTopicsDto {
  @ApiProperty({
    example: 2,
  })
  @IsInt()
  @Min(0)
  completed: number;

  @ApiProperty({
    example: 18,
  })
  @IsInt()
  @Min(0)
  total: number;
}

export class SimuladoDayDto {
  @ApiProperty({
    example: 1,
  })
  @IsInt()
  @Min(1)
  day: number;

  @ApiProperty({
    example: 'Dia 1',
  })
  @IsString()
  label: string;

  @ApiProperty({
    example: 15,
  })
  @IsInt()
  @Min(0)
  correct: number;

  @ApiProperty({
    example: 45,
  })
  @IsInt()
  @Min(0)
  total: number;

  @ApiProperty({
    example: 33.3,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  scorePercentage: number;
}

export class SimuladoDto {
  @ApiProperty({
    example: '3ff4b29c-ee63-4757-8415-e5627b10c86c',
  })
  @IsUUID()
  attemptId: string;

  @ApiProperty({
    example: 'Simulado ENEM | Janeiro',
  })
  @IsString()
  examName: string;

  @ApiProperty({
    example: '2026-01-15',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  date: string | null;

  @ApiProperty({
    type: () => [SimuladoDayDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimuladoDayDto)
  days: SimuladoDayDto[];
}

export class AccuracyBySubjectDto {
  @ApiProperty({
    example: 'uuid',
  })
  @IsUUID()
  subjectId: string;

  @ApiProperty({
    example: 'Matemática',
  })
  @IsString()
  subjectName: string;

  @ApiProperty({
    example: 10,
  })
  @IsInt()
  @Min(0)
  correct: number;

  @ApiProperty({
    example: 24,
  })
  @IsInt()
  @Min(0)
  totalAnswered: number;
}

export class UserStatsDataDto {
  @ApiProperty({ type: () => OverviewDto })
  @ValidateNested()
  @Type(() => OverviewDto)
  overview: OverviewDto;

  @ApiProperty({ type: () => LevelDto })
  @ValidateNested()
  @Type(() => LevelDto)
  level: LevelDto;

  @ApiProperty({ type: () => CompletedTopicsDto })
  @ValidateNested()
  @Type(() => CompletedTopicsDto)
  completedTopics: CompletedTopicsDto;

  @ApiProperty({
    example: 156,
  })
  @IsInt()
  @Min(0)
  stars: number;

  @ApiProperty({
    example: 10,
  })
  @IsInt()
  @Min(0)
  streak: number;

  @ApiProperty({
    type: () => [SimuladoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimuladoDto)
  simulados: SimuladoDto[];

  @ApiProperty({
    type: () => [AccuracyBySubjectDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccuracyBySubjectDto)
  accuracyBySubject: AccuracyBySubjectDto[];
}

export class UserStatsDto {
  @ApiProperty({ type: () => UserStatsDataDto })
  @ValidateNested()
  @Type(() => UserStatsDataDto)
  data: UserStatsDataDto;
}
