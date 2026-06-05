import { ApiProperty } from '@nestjs/swagger';

export class StreakDataDto {
  @ApiProperty({ example: 8, description: 'Quantidade de dias consecutivos do streak' })
  streakDays!: number;

  @ApiProperty({
    example: true,
    description: 'Indica se o usuario ja manteve o streak hoje (respondeu ao menos uma questao)',
  })
  streakActive!: boolean;
}
