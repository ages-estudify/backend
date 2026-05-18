import { ApiProperty } from '@nestjs/swagger';

export class EarnCoinsResponseDto {
  @ApiProperty({
    description: 'Coins earned in this action',
    example: 1,
  })
  coinsEarned!: number;

  @ApiProperty({
    description: 'Total coins after the action',
    example: 47,
  })
  totalCoins!: number;
}
