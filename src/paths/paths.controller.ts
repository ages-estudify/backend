import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';

@ApiTags('paths')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller({ path: 'paths', version: '1' })
export class PathsController {}
