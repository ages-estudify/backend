import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateExamRequestDto {
  @ApiProperty({ example: 'Simulado ENEM - Novembro 2024', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'ENEM', required: false })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiProperty({
    required: false,
    description: 'Exam cover as base64 (raw or data URI, e.g. data:image/png;base64,...)',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'PUBLISHED', enum: ['DRAFT', 'PUBLISHED'], required: false })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED';
}

export class UpdateExamResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', example: 'uuid' },
      title: { type: 'string', example: 'Simulado ENEM - Novembro 2024' },
      origin: { type: 'string', example: 'ENEM' },
      imageUrl: { type: 'string', example: 'https://s3.amazonaws.com/bucket/exam-logo-uuid.png' },
      status: { type: 'string', example: 'PUBLISHED' },
    },
  })
  data!: {
    id: string;
    title: string;
    origin: string;
    imageUrl: string | null;
    status: string;
  };
}
