import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsInt, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportCsvErrorDto {
  @ApiProperty({ example: 20 })
  @IsInt()
  line!: number;

  @ApiProperty({ example: 'Correct answer must be A-E' })
  @IsString()
  error!: string;
}

export class ImportExamResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      examId: { type: 'string', example: 'uuid' },
      status: { type: 'string', example: 'DRAFT' },
      daysCreated: { type: 'number', example: 2 },
      importedQuestions: { type: 'number', example: 179 },
      failed: { type: 'number', example: 1 },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            line: { type: 'number' },
            error: { type: 'string' },
          },
        },
      },
    },
  })
  data!: {
    examId: string;
    status: string;
    daysCreated: number;
    importedQuestions: number;
    failed: number;
    errors: ImportCsvErrorDto[];
  };
}

export class ImportExamRequestDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: Express.Multer.File;
}
