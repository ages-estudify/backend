import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterResponseDataDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ description: 'JWT access token' })
  token!: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  role!: Role;

  @ApiProperty({
    nullable: true,
    example: '2026-12-31',
    description: 'Plan end date or null when no plan',
  })
  planExpirationDate!: string | null;
}

export class RegisterSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ type: RegisterResponseDataDto })
  data!: RegisterResponseDataDto;
}
