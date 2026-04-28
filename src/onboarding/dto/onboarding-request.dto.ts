import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { WeekDay, Language } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingRequestDto {
  @ApiPropertyOptional({ example: 'Engenharia de Software' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  desiredCourse?: string;

  @ApiPropertyOptional({ example: 'USP' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  desiredUniversity?: string;

  @ApiPropertyOptional({ enum: Language, example: 'ENGLISH' })
  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;

  @ApiPropertyOptional({
    example: { MONDAY: [18, 19], WEDNESDAY: [20] },
  })
  @IsOptional()
  @IsObject()
  studyHours?: Partial<Record<WeekDay, number[]>>;
}
