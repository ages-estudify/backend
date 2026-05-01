import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OnboardingRequestDto } from './dto/onboarding-request.dto';
import { WeekDay } from '@prisma/client';

@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveOnboarding(userId: string, dto: OnboardingRequestDto): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(dto.desiredCourse !== undefined && { desired_course: dto.desiredCourse }),
          ...(dto.desiredUniversity !== undefined && { desired_university: dto.desiredUniversity }),
          ...(dto.preferredLanguage !== undefined && { preferred_language: dto.preferredLanguage }),
          onboarding_completed: true,
        },
      });

      if (dto.studyHours !== undefined) {
        await tx.studyDay.deleteMany({ where: { user_id: userId } });

        const studyDays = Object.entries(dto.studyHours).flatMap(([day, hours]) =>
          (hours ?? []).map((hour: number) => ({
            user_id: userId,
            day: day as WeekDay,
            hour,
          })),
        );

        if (studyDays.length > 0) {
          await tx.studyDay.createMany({ data: studyDays });
        }
      }
    });
  }
}
