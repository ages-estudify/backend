import { BadRequestException, Injectable } from '@nestjs/common';
import { OnboardingRepository } from './onboarding.repository';
import { OnboardingRequestDto } from './dto/onboarding-request.dto';
import { WeekDay } from '@prisma/client';

const VALID_WEEK_DAYS = Object.values(WeekDay);

@Injectable()
export class OnboardingService {
  constructor(private readonly onboardingRepository: OnboardingRepository) {}

  async completeOnboarding(userId: string, dto: OnboardingRequestDto): Promise<void> {
    if (dto.studyHours !== undefined) {
      const entries = Object.entries(dto.studyHours);

      if (entries.length === 0) {
        throw new BadRequestException('Dados de onboarding inválidos');
      }

      for (const [day, hours] of entries) {
        if (!VALID_WEEK_DAYS.includes(day as WeekDay)) {
          throw new BadRequestException('Dados de onboarding inválidos');
        }

        if (!hours || hours.length === 0) {
          throw new BadRequestException('Dados de onboarding inválidos');
        }

        for (const hour of hours) {
          if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
            throw new BadRequestException('Dados de onboarding inválidos');
          }
        }

        if (new Set(hours).size !== hours.length) {
          throw new BadRequestException('Dados de onboarding inválidos');
        }
      }
    }

    await this.onboardingRepository.saveOnboarding(userId, dto);
  }
}
