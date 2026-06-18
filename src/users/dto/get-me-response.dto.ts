import { ApiProperty } from '@nestjs/swagger';

export class GetMeResponseDto {
  @ApiProperty({ nullable: true, example: '2026-12-31' })
  plan_end_date: Date | null;

  @ApiProperty()
  onboarding_completed: boolean;

  @ApiProperty({ nullable: true, example: 'https://...signed-url...' })
  profile_picture_url: string | null;
}
