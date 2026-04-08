import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsUUID,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language, Origin } from '@prisma/client';

class UpdateAlternativeDto {
  @ApiPropertyOptional({ example: 'A' })
  @IsString()
  @MinLength(1)
  @MaxLength(1)
  letter!: string;

  @ApiPropertyOptional({ example: 'Option text' })
  @IsString()
  @MinLength(1)
  text!: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  is_correct!: boolean;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'uuid-path-id' })
  @IsOptional()
  @IsUUID()
  path_id?: string;

  @ApiPropertyOptional({ example: 'uuid-exam-id' })
  @IsOptional()
  @IsUUID()
  exam_id?: string;

  @ApiPropertyOptional({ example: 'Quanto é 2+2?' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;

  @ApiPropertyOptional({ example: 'Soma básica.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  feedback?: string;

  @ApiPropertyOptional({ example: 'https://image.url' })
  @IsOptional()
  @IsString()
  image?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  number?: number | null;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  day?: number | null;

  @ApiPropertyOptional({ enum: Language, nullable: true, example: null })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(Language)
  language?: Language | null;

  @ApiPropertyOptional({ enum: Origin, example: 'ORIGINAL' })
  @IsOptional()
  @IsEnum(Origin)
  origin?: Origin;

  @ApiPropertyOptional({ example: true, description: 'Enable/disable question' })
  @IsOptional()
  @IsBoolean()
  enable?: boolean;

  @ApiPropertyOptional({ type: [UpdateAlternativeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @Type(() => UpdateAlternativeDto)
  alternatives?: UpdateAlternativeDto[];
}
