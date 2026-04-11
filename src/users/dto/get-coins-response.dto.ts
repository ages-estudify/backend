import { ApiProperty } from '@nestjs/swagger';

export class GetCoinsDataDto {
  @ApiProperty({
    description: 'Current coins balance',
    example: 47,
  })
  coins!: number;
}

export class GetCoinsResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: GetCoinsDataDto })
  data!: GetCoinsDataDto;
}
