import {
  Controller,
  Get,
  Param,
  UseGuards,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNoContentResponse,
  ApiBody,
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
import { UploadProfilePictureDto } from './dto/upload-profile-picture.dto';
import { GetUserProfileResponseDto } from './dto/get-user-profile-response.dto';

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
  @ApiOkResponse({ type: GetUserProfileResponseDto })
  @ApiForbiddenResponse({ description: 'Cannot access another user profile' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(
    @CurrentUser() viewer: JwtAuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<GetUserProfileResponseDto> {
    return this.usersService.findOne(viewer, id);
  }
  @Patch('profile-picture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload or replace profile picture' })
  @ApiBody({ type: UploadProfilePictureDto })
  @ApiOkResponse({
    description: 'Profile picture uploaded successfully',
    schema: { example: { data: { profilePictureUrl: 'https://...signed-url...' } } },
  })
  async uploadProfilePicture(
    @CurrentUser() user: JwtAuthUser,
    @Body() dto: UploadProfilePictureDto,
  ): Promise<{ data: { profilePictureUrl: string } }> {
    const url = await this.usersService.uploadProfilePicture(user.userId, dto.image);
    return { data: { profilePictureUrl: url } };
  }

  @Delete('profile-picture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove profile picture' })
  @ApiNoContentResponse({ description: 'Profile picture removed successfully' })
  async removeProfilePicture(@CurrentUser() user: JwtAuthUser): Promise<void> {
    await this.usersService.removeProfilePicture(user.userId);
  }
}
