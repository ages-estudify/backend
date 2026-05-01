import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttemptDaysService } from './attempt-days.service';
import { AttemptDayResultResponseDto } from './dto/attempt-day-result-response.dto';

@ApiTags('attempt-days')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
@Controller({ path: 'attempt-days', version: '1' })
export class AttemptDaysController {
  constructor(private readonly attemptDaysService: AttemptDaysService) {}

  @Get(':attemptDayId/result')
  @ApiOperation({
    summary: 'Get detailed result for a finished attempt day (includes answer key)',
    description:
      'Returns the full breakdown for a single day of a simulated exam, including correct alternatives and feedback. Only the owner can access; other users receive 404.',
  })
  @ApiOkResponse({ type: AttemptDayResultResponseDto })
  @ApiBadRequestResponse({
    description: 'Attempt day has not been finished yet',
    schema: { example: { success: false, message: 'Attempt day not finished yet' } },
  })
  @ApiNotFoundResponse({
    description: 'Attempt day not found or does not belong to the current user',
    schema: { example: { success: false, message: 'Result not found' } },
  })
  async getResult(
    @Param('attemptDayId', new ParseUUIDPipe({ version: '4' })) attemptDayId: string,
    @CurrentUser() user: JwtAuthUser,
  ): Promise<AttemptDayResultResponseDto> {
    return this.attemptDaysService.getAttemptDayResult(attemptDayId, user.userId);
  }
}
