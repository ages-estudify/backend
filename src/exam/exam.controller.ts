import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtAuthUser } from '../auth/security/jwt-auth-user';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { ExamListingDto } from './dto/examListing.dto';

@Controller('exams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')
export class ExamController {
  constructor(private readonly examservice: ExamService) {}

  @Get()
  @ApiOkResponse()
  async examListing(@CurrentUser() user: JwtAuthUser){
    return this.examservice.findAllWithLastAttemptByUser(user.userId);
  }

 
}
