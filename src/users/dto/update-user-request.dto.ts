import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language, Role } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateUserRequestDto {
  @ApiPropertyOptional({ example: 'Pedro Silva' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ example: 'pedro@gmail.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional({ example: '51999999999' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.USER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: '2026-08-31T21:27:35.840Z' })
  @IsOptional()
  @IsISO8601()
  planEndDate?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  streak?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  coins?: number;

  @ApiPropertyOptional({ example: 'Medicina' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  desiredCourse?: string;

  @ApiPropertyOptional({ example: 'USP' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  desiredUniversity?: string;

  @ApiPropertyOptional({ enum: Language, example: Language.ENGLISH })
  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;

  @ApiPropertyOptional({ example: '1999-05-15', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString({}, { message: 'birthDate must be a valid YYYY-MM-DD date' })
  birthDate?: string;
}
