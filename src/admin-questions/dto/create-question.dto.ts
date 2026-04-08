import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language, Origin } from '@prisma/client';

export class AlternativeDto {
  @ApiProperty({ example: 'A', description: 'Letter A-E' })
  @IsString()
  @MinLength(1)
  @MaxLength(1)
  letter!: string;

  @ApiProperty({ example: 'Option text' })
  @IsString()
  @MinLength(1)
  text!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_correct!: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'uuid-path-id' })
  @IsUUID()
  path_id!: string;

  @ApiPropertyOptional({ example: 'uuid-exam-id' })
  @IsOptional()
  @IsUUID()
  exam_id?: string;

  @ApiProperty({ example: 'Quanto é 2+2?' })
  @IsString()
  @MinLength(1)
  text!: string;

  @ApiProperty({ example: 'Soma básica.' })
  @IsString()
  @MinLength(1)
  feedback!: string;

  @ApiPropertyOptional({ example: 'data:image/png;base64,[b64]' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  number?: number;

  @ApiProperty({ example: 2018 })
  @IsInt()
  year!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  day?: number;

  @ApiPropertyOptional({ enum: Language, example: 'ENGLISH' })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiProperty({ enum: Origin, example: 'ORIGINAL' })
  @IsEnum(Origin)
  origin!: Origin;

  @ApiProperty({ type: [AlternativeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @Type(() => AlternativeDto)
  alternatives!: AlternativeDto[];
}
