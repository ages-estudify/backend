import { Injectable } from '@nestjs/common';
import { ExamRepository } from './exams.repository';
import { ExamListingWithAttemptsByUserDto } from './dto/examListingWithAttemptsByUser.dto';
import { ExamMapper } from './mapper/exam.mapper';

@Injectable()
export class ExamService {
  /* istanbul ignore next */
  constructor(private examRepository: ExamRepository) {}

  async findAllWithLastAttemptByUser(userId: string): Promise<ExamListingWithAttemptsByUserDto> {
    const result = await this.examRepository.findAllWithLastAttemptByUserTRUE(userId);

    await this.examRepository.findAllWithLastAttemptByUser(userId);
    return {
      success: true,
      data: ExamMapper.toDtoList(result),
    };
  }
}
