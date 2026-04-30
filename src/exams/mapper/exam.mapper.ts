import { ExamDto, DayDto } from '../dto/examListingWithAttemptsByUser.dto';

export class ExamMapper {
  static toDay(item: any, day: number): DayDto {
    return {
      day,
      totalQuestions: day === 1 ? item.totalQuestions1 : item.totalQuestions2,
      answeredQuestions: day === 1 ? item.answeredQuestions1 : item.answeredQuestions2,
      isCompleted: day === 1 ? item.isCompleted1 : item.isCompleted2,
    };
  }

  static toDto(item: any): ExamDto {
    return {
      id: item.id,
      name: item.name,
      totalQuestions: item.totalQuestions,
      origin: item.origin,
      status: item.status,
      answeredQuestions: item.answeredQuestions,
      image_url: item.image_url,

      days: [1, 2].map((day) => this.toDay(item, day)),
    };
  }

  static toDtoList(items: any[]): ExamDto[] {
    return items.map((item) => this.toDto(item));
  }
}
