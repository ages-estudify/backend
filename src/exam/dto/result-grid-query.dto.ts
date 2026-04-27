import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum ResultGridStatusFilter {
  CERTO = 'CERTO',
  ERRADO = 'ERRADO',
  NULO = 'NULO',
}

export class ResultGridQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtra por status. Podes repetir o parâmetro (ex.: statusFilter=CERTO&statusFilter=NULO). Omitir devolve todas.',
    enum: ResultGridStatusFilter,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return Array.isArray(value) ? value : [value];
  })
  @IsEnum(ResultGridStatusFilter, { each: true })
  statusFilter?: ResultGridStatusFilter[];
}
