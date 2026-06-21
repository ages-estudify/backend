import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiBody,
} from '@nestjs/swagger';
import { RegisterRequestDto } from '../auth/dto/register-request.dto';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
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
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PasswordResetGuard } from '../auth/guards/password-reset.guard';
import { UploadProfilePictureDto } from './dto/upload-profile-picture.dto';
import { GetUserProfileResponseDto } from './dto/get-user-profile-response.dto';
import { GetMeResponseDto } from './dto/get-me-response.dto';

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

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADM)
  @ApiOperation({ summary: 'Create a user (admin only)' })
  @ApiCreatedResponse({ description: 'User created' })
  @ApiConflictResponse({ description: 'Email or phone already registered' })
  @ApiForbiddenResponse({ description: 'Authenticated but not an admin' })
  createUser(@Body() dto: RegisterRequestDto) {
    return this.usersService.createUser(dto);
  }

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

  @Get('me')
  @ApiOperation({ summary: 'Get current user basic info' })
  @ApiOkResponse({ type: GetMeResponseDto })
  async getMe(@CurrentUser() user: JwtAuthUser): Promise<GetMeResponseDto> {
    return this.usersService.getMe(user.userId);
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

  @Patch('preferences')
  @ApiOperation({ summary: 'Update user preferences and recalculates study schedule' })
  @ApiOkResponse({
    description: 'Succesfully updated preferences',
    schema: {
      example: { success: true, message: 'Preferências atualizadas e cronograma recalculado.' },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid validation data' })
  async updatePreferences(@CurrentUser() user: JwtAuthUser, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(user.userId, dto);
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

  @Put(':id')
  @ApiOperation({ summary: 'Update user fields (self or admin)' })
  @ApiOkResponse({ description: 'User updated' })
  @ApiConflictResponse({ description: 'Email or phone already registered' })
  @ApiForbiddenResponse({ description: 'Cannot update another user profile' })
  @ApiNotFoundResponse({ description: 'User not found' })
  updateUser(
    @CurrentUser() viewer: JwtAuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ) {
    return this.usersService.updateUser(viewer, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADM)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable a user (admin only)' })
  @ApiNoContentResponse({ description: 'User disabled' })
  @ApiForbiddenResponse({ description: 'Authenticated but not an admin' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async disableUser(@Param('id') id: string): Promise<void> {
    await this.usersService.disableUser(id);
  }
}
