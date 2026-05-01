import {
  ExamDto,
  DayDto,
  ExamListingWithAttemptsByUserDto,
} from '../dto/examListingWithAttemptsByUser.dto';

export class ExamMapper {
  static toResponse(items: any[]): ExamListingWithAttemptsByUserDto {
    return {
      success: true,
      data: items.map((item) => this.toDto(item)),
    };
  }

  static toDto(item: any): ExamDto {
    const days: DayDto[] = [1, 2].map((day) => {
      const attemptDay = item.attempt_days?.find((d) => d.exam_day.day === day);

      return {
        day,
        totalQuestions:
          day === 1
            ? (item.exam_days?.[0]?._count.questions ?? 0)
            : (item.exam_days?.[1]?._count.questions ?? 0),

        answeredQuestions: attemptDay?._count.answers ?? 0,

        isCompleted: attemptDay?.isCompleted ?? false,
      };
    });

    const totalQuestions = days.reduce((acc, d) => acc + d.totalQuestions, 0);

    const answeredQuestions = days.reduce((acc, d) => acc + d.answeredQuestions, 0);

    const isCompleted = item.isCompleted ?? false;

    let status: ExamDto['status'] = 'available';

    if (isCompleted) {
      status = 'completed';
    } else if (item.totalAnswers > 0) {
      status = 'in_progress';
    }

    return {
      id: item.id,
      name: item.name,
      image_url: item.image_url,
      origin: item.origin,

      status,

      totalQuestions,
      answeredQuestions,

      days,
    };
  }
}
