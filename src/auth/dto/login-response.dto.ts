import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class LoginResponseDataDto {
  @ApiProperty({ description: 'JWT access token' })
  token!: string;

  @ApiProperty({
    description:
      'Opaque refresh token (store securely; use POST /auth/refresh to obtain new access token)',
  })
  refreshToken!: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  role!: Role;

  @ApiProperty({
    nullable: true,
    example: '2026-12-31',
    description: 'Plan end date or null when no plan',
  })
  planExpirationDate!: string | null;
}

export class LoginSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ type: LoginResponseDataDto })
  data!: LoginResponseDataDto;
}
