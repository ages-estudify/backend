import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionDataDto {
  @ApiProperty({ example: true })
  planActive!: boolean;

  @ApiProperty({ example: '2026-07-15', nullable: true })
  planExpirationDate!: string | null;

  @ApiProperty()
  token!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class SubscriptionSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ type: SubscriptionDataDto })
  data!: SubscriptionDataDto;
}
