import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class EarnCoinsDto {
  @ApiProperty({
    description: 'User ID',
    example: 'uuid',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Whether the answer is correct',
    example: true,
  })
  @IsBoolean()
  isCorrect!: boolean;
  @ApiProperty({
    description: 'Whether the question is from a simulated exam',
    example: false,
  })
  @IsBoolean()
  isSimulated!: boolean;
}
