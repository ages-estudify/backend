import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({ example: 'Álgebra Básica' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Subject id (FK)' })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ example: 1, description: 'Order within the subject (must be greater than zero)' })
  @IsInt()
  @Min(1)
  order!: number;

  @ApiPropertyOptional({ example: 'Introdução à álgebra...' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    description: 'Ícone da trilha em base64 ou data URI (será enviado ao S3)',
  })
  @IsOptional()
  @IsString()
  icon?: string;
}
