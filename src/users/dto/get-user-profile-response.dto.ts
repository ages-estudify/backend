import { ApiProperty } from '@nestjs/swagger';

export class GetUserProfileResponseDto {
  @ApiProperty({
    description: 'User UUID',
  })
  id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Maria dos Santos',
  })
  full_name: string;

  @ApiProperty({
    description: 'User e-mail',
    example: 'email@email.com',
  })
  email: string;

  @ApiProperty({
    nullable: true,
    description: 'User phone number',
    example: '9999-9999',
  })
  phone_number: string | null;

  @ApiProperty({
    description: 'User role',
    example: 'ADM',
  })
  role: string;

  @ApiProperty({
    nullable: true,
    description: 'Expiration plan date',
    example: '2026-12-31',
  })
  plan_end_date: Date | null;

  @ApiProperty({
    nullable: true,
    description: 'The course the user intends to apply to',
    example: 'Engenharia de Software',
  })
  desired_course: string | null;

  @ApiProperty({
    nullable: true,
    description: 'The language the user intends to study for the exams',
    example: 'ENGLISH',
  })
  preferred_language: string | null;

  @ApiProperty({
    nullable: true,
    description: 'The university the user intends to apply to',
    example: 'Universidade Federal do Rio Grande do Sul',
  })
  desired_university: string | null;

  @ApiProperty({
    description: 'Account creation date',
    example: '2025-11-11',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Plan current status, true for active and false for inactive',
  })
  enable: boolean;

  @ApiProperty({
    nullable: true,
    description: 'User`s last active time',
    example: '2026-04-12',
  })
  last_active: Date | null;

  @ApiProperty({
    nullable: true,
    description: 'User`s birth date',
    example: '2003-09-17',
  })
  birth_date: Date | null;

  @ApiProperty({
    description: 'If user completed onboarding process',
  })
  onboarding_completed: boolean;
}
