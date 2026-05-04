import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionSuccessResponseDto } from './dto/subscription-response.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Activate a subscription plan for the authenticated user' })
  @ApiCreatedResponse({ type: SubscriptionSuccessResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: { example: { success: false, message: 'planType must be TRIMESTRAL or ANUAL' } },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT',
    schema: { example: { success: false, message: 'Unauthorized' } },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: { example: { success: false, message: 'User not found' } },
  })
  async create(@CurrentUser() user: JwtAuthUser, @Body() body: CreateSubscriptionDto) {
    const data = await this.service.activatePlan(user.userId, body.planType);
    return { success: true as const, data };
  }
}
