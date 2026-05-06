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
    const examDayByNumber = new Map<number, any>(
      (item.exam_days ?? []).map((ed: any) => [ed.day, ed]),
    );

    const days: DayDto[] = [1, 2].map((day) => {
      const attemptDay = item.attempt_days?.find((d) => d.exam_day.day === day);
      const examDay = examDayByNumber.get(day);

      const hasLanguageChoice = (examDay?.questions ?? []).some(
        (q: { language: string | null }) => q.language != null,
      );

      let dayStatus: DayDto['status'];
      if (!attemptDay) {
        dayStatus = 'available';
      } else if (attemptDay.isCompleted) {
        dayStatus = 'completed';
      } else {
        dayStatus = 'in_progress';
      }

      return {
        examDayId: examDay?.id ?? '',
        day,
        totalQuestions: examDay?._count?.questions ?? 0,

        answeredQuestions: attemptDay?._count.answers ?? 0,

        isCompleted: attemptDay?.isCompleted ?? false,

        status: dayStatus,

        hasLanguageChoice,
      };
    });

    const totalQuestions = days.reduce((acc, d) => acc + d.totalQuestions, 0);

    const answeredQuestions = days.reduce((acc, d) => acc + d.answeredQuestions, 0);

    const progress = {
      answered: answeredQuestions,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
    };

    const isCompleted = item.isCompleted ?? false;

    let status: ExamDto['status'];

    if (isCompleted) {
      status = 'completed';
    } else if (item.hasAttempt) {
      status = 'in_progress';
    } else {
      status = 'available';
    }

    const hasLanguageChoice = days.some((d) => d.hasLanguageChoice);

    return {
      id: item.id,
      name: item.name,
      image_url: item.image_url,
      origin: item.origin,

      status,

      totalQuestions,
      answeredQuestions,
      progress,

      hasLanguageChoice,

      days,
    };
  }
}
