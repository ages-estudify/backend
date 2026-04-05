import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUrl, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectListingDto {
  @ApiProperty({ example: 'uuid-subject-id' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'Matemática' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'https://cdn.com/icon.png' })
  @IsUrl()
  icon!: string;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(0)
  totalQuestions!: number;

  @ApiProperty({ example: 45 })
  @IsNumber()
  @Min(0)
  answeredQuestions!: number;
}

export class SubjectListingResponseDto {
  @ApiProperty({ type: [SubjectListingDto] })
  @ValidateNested({ each: true })
  @Type(() => SubjectListingDto)
  data!: SubjectListingDto[];
}
