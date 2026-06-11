import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import { UsersService } from './users.service';
import { GetCoinsResponseDto } from './dto/get-coins-response.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { StreakService } from '../streak/streak.service';
import { StreakDataDto } from '../streak/dto/streak-response.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PasswordResetGuard } from '../auth/guards/password-reset.guard';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid JWT',
  schema: { example: { success: false, message: 'Unauthorized' } },
})
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly streakService: StreakService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADM)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiForbiddenResponse({ description: 'Authenticated but not an admin' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, PasswordResetGuard)
  @ApiBearerAuth()
  @Patch('update/password')
  async updatePassword(@CurrentUser() user: JwtAuthUser, @Body() dto: UpdatePasswordDto) {
    await this.usersService.updateUserPassword(user.userId, dto.newPassword);

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('stats')
  @ApiOkResponse({ type: UserStatsDto })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async getStats(@CurrentUser() user: JwtAuthUser): Promise<UserStatsDto> {
    return await this.usersService.getStats(user.userId);
  }

  @Get('me/coins')
  @ApiOperation({ summary: 'Get current user coins balance' })
  @ApiOkResponse({ type: GetCoinsResponseDto })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: { example: { success: false, message: 'User not found' } },
  })
  async getCoins(@CurrentUser() user: JwtAuthUser): Promise<GetCoinsResponseDto> {
    const coins = await this.usersService.getCoins(user.userId);
    return {
      success: true,
      data: { coins },
    };
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get current user streak (consecutive active days)' })
  @ApiOkResponse({ type: StreakDataDto })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: { example: { message: 'User not found' } },
  })
  async getStreak(@CurrentUser() user: JwtAuthUser): Promise<StreakDataDto> {
    return this.streakService.getStreak(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (self or admin)' })
  @ApiForbiddenResponse({ description: 'Cannot access another user profile' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@CurrentUser() viewer: JwtAuthUser, @Param('id') id: string) {
    return this.usersService.findOne(viewer, id);
  }
}
