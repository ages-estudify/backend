import { Injectable } from '@nestjs/common';
import { ExamRepository } from './exam.repository';
import { ExamListingDto } from './dto/examListing.dto';

@Injectable()
export class ExamService {
  constructor(private examRepository: ExamRepository) {}

  async findAllWithLastAttemptByUser(userId: string): Promise<ExamListingDto> {
    const result = await this.examRepository.findAllWithLastAttemptByUser(userId);

    return {
      success: true,
      data: result.map((item) => ({
        id: item.id,
        name: item.name,
        totalQuestions: item.totalQuestions,
        origin: item.origin,
        status: item.status,
        answeredQuestions: item.answeredQuestions,
        image_url: item.image_url,
        languages: item.language,

        days: [
          {
            day: 1,
            totalQuestions: item.totalQuestions1,
            isCompleted: item.isCompleted1,
          },
          {
            day: 2,
            totalQuestions: item.totalQuestions2,
            isCompleted: item.isCompleted2,
          },
        ],
      })),
    };
  }
}
