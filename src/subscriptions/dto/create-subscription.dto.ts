import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: PlanType, example: PlanType.TRIMESTRAL })
  @IsEnum(PlanType, { message: 'planType must be TRIMESTRAL or ANUAL' })
  planType!: PlanType;
}
