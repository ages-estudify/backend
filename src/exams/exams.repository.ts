import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExamRepository {
  constructor(private prisma: PrismaService) {}

  async findAllExams() {
    const exams = await this.prisma.exam.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        origin: true,
        name: true,
        image_url: true,
        exam_days: {
          select: {
            _count: {
              select: { questions: true },
            },
          },
        },
      },
    });

    const examsWithTotalQuestions = exams.map((exam) => ({
      ...exam,
      totalQuestions: exam.exam_days.reduce((acc, day) => acc + (day._count.questions ?? 0), 0),
    }));

    return examsWithTotalQuestions;
  }

  async findAllAttemptsByUser(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: {
        user_id: userId,
      },
      orderBy: [{ exam_id: 'asc' }, { init_time: 'desc' }],
      distinct: ['exam_id'],
      select: {
        exam_id: true,
        end_time: true,
        attempt_days: {
          select: {
            end_time: true,
            exam_day: {
              select: {
                day: true,
              },
            },
            _count: {
              select: {
                answers: true,
              },
            },
          },
        },
      },
    });

    return attempts.map((attempt) => ({
      exam_id: attempt.exam_id,

      isCompleted: attempt.end_time !== null,

      totalAnswers: attempt.attempt_days.reduce((acc, day) => acc + (day._count.answers ?? 0), 0),

      attempt_days: attempt.attempt_days.map((day) => ({
        exam_day: day.exam_day,
        _count: day._count,
        isCompleted: day.end_time !== null,
      })),
    }));
  }
}
