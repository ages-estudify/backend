import { Injectable } from '@nestjs/common';
import { ExamRepository } from './exams.repository';
import { ExamListingWithAttemptsByUserDto } from './dto/examListingWithAttemptsByUser.dto';
import { ExamMapper } from './mapper/exam.mapper';

@Injectable()
export class ExamService {
  constructor(private examRepository: ExamRepository) {}

  async findAllWithLastAttemptByUser(userId: string): Promise<ExamListingWithAttemptsByUserDto> {
    const exams = await this.examRepository.findAllExams();
    const attempts = await this.examRepository.findAllAttemptsByUser(userId);

    const attemptByExamId = new Map(attempts.map((a) => [a.exam_id, a]));

    const result = exams.map((exam) => {
      const attempt = attemptByExamId.get(exam.id);

      return {
        ...exam,
        isCompleted: attempt?.isCompleted ?? false,
        totalAnswers: attempt?.totalAnswers ?? 0,
        attempt_days: attempt?.attempt_days ?? [],
      };
    });

    const response = ExamMapper.toResponse(result);

    const sorted = {
      ...response,
      data: response.data.sort((a, b) => {
        const order = {
          in_progress: 1,
          available: 2,
          completed: 3,
        };

        return order[a.status] - order[b.status];
      }),
    };

    return sorted;
  }
}
