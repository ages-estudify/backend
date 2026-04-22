import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  IsUUID,
  ValidateNested,
  IsIn,
  isString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DayDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  day!: number;

  @ApiProperty({ example: 75 })
  @IsInt()
  totalQuestions!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCompleted!: boolean;

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
    enum: ['completed', 'in_progress', 'not_started'],
  })
  @IsString()
  @IsIn(['completed', 'in_progress', 'not_started'])
  status!: 'completed' | 'in_progress' | 'not_started';

  @ApiProperty({ example: 0 })
  @IsInt()
  answeredQuestions!: number;

  @ApiProperty({ example: 'https://cdn.com/image.png' })
  @IsString()
  image_url!: string;

 @ApiProperty({ enum: ['ENGLISH', 'SPANISH'] })
  @IsIn(['ENGLISH', 'SPANISH'])
  @IsString()
  languages!: 'ENGLISH' | 'SPANISH';

  @ApiProperty({ type: [DayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayDto)
  days!: DayDto[];
}

export class ExamListingDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({ type: [ExamDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamDto)
  data!: ExamDto[];
}