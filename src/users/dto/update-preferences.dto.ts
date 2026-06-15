import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Language, WeekDay } from '@prisma/client';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ example: 'Pedro Silva' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Engenharia de Software' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  desiredCourse?: string;

  @ApiPropertyOptional({ example: 'Universidade Federal de São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  desiredUniversity?: string;

  @ApiPropertyOptional({ enum: Language, example: 'ENGLISH' })
  @IsOptional()
  @IsString()
  @IsEnum(Language)
  preferredLanguage?: Language;

  @ApiPropertyOptional({
    example: { MONDAY: [18, 19], WEDNESDAY: [20] },
  })
  @IsOptional()
  @IsObject()
  studyHours?: Partial<Record<WeekDay, number[]>>;
}
