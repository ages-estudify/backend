import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Origin, ExamStatus, Role } from '@prisma/client';

export interface CreateExamData {
  name: string;
  origin: string;
}

export interface CreateExamDayData {
  day: number;
  exam_id: string;
}

export interface CreateQuestionData {
  text: string;
  origin: Origin;
  year: number;
  feedback: string;
  path_id: string;
  exam_day_id: string;
}

export interface CreateAlternativeData {
  text: string;
  letter: string;
  is_correct: boolean;
  question_id: string;
}

export const ATTEMPT_RESULT_GRID_INCLUDE = {
  attempt_days: {
    include: {
      exam_day: {
        select: {
          day: true,
          questions: {
            select: {
              id: true,
              number: true,
              alternatives: {
                select: {
                  letter: true,
                  is_correct: true,
                },
              },
            },
          },
        },
      },
      answers: {
        include: {
          question: {
            include: {
              alternatives: {
                select: {
                  letter: true,
                  is_correct: true,
                },
              },
            },
          },
          alternative: {
            select: {
              letter: true,
            },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class ExamsRepository {
  constructor(private prisma: PrismaService) {}

  async findAllExamsByRole(userRole: Role, take?: number, skip?: number) {
    const where = userRole === Role.ADM ? {} : { status: ExamStatus.PUBLISHED };

    const exams = await this.prisma.exam.findMany({
      where,
      select: {
        id: true,
        origin: true,
        status: true,
        name: true,
        media_key: true,
        exam_days: {
          select: {
            id: true,
            day: true,
            _count: {
              select: { questions: true },
            },
            questions: { select: { language: true } },
          },
        },
      },
      take,
      skip,
    });

    return exams.map((exam) => ({
      ...exam,
      totalQuestions: exam.exam_days.reduce((acc, day) => acc + (day._count.questions ?? 0), 0),
    }));
  }

  async findExamById(id: string) {
    return this.prisma.exam.findUnique({
      where: { id },
      include: {
        exam_days: {
          include: {
            questions: true,
          },
        },
      },
    });
  }

  async createExam(data: CreateExamData) {
    return this.prisma.exam.create({
      data: {
        name: data.name,
        origin: data.origin,
        media_key: null,
        status: 'DRAFT',
      },
    });
  }

  async createExamDay(data: CreateExamDayData) {
    return this.prisma.examDay.create({
      data: {
        day: data.day,
        exam_id: data.exam_id,
      },
    });
  }

  async createQuestion(data: CreateQuestionData) {
    return this.prisma.question.create({
      data: {
        text: data.text,
        origin: data.origin,
        year: data.year,
        feedback: data.feedback,
        path_id: data.path_id,
        exam_day_id: data.exam_day_id,
      },
    });
  }

  async createAlternative(data: CreateAlternativeData) {
    return this.prisma.alternative.create({
      data: {
        text: data.text,
        letter: data.letter,
        is_correct: data.is_correct,
        question_id: data.question_id,
      },
    });
  }

  async updateExam(
    id: string,
    data: {
      name?: string;
      origin?: string;
      media_key?: string | null;
      status?: ExamStatus;
    },
  ) {
    return this.prisma.exam.update({
      where: { id },
      data,
    });
  }

  async deleteExamLogical(id: string) {
    return this.prisma.exam.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async pathExists(pathId: string): Promise<boolean> {
    const path = await this.prisma.path.findUnique({
      where: { id: pathId },
      select: { id: true },
    });
    return !!path;
  }

  async subjectExists(subjectName: string): Promise<string | null> {
    const subject = await this.prisma.subject.findFirst({
      where: { name: subjectName },
      select: { id: true },
    });
    return subject?.id ?? null;
  }

  async pathByNameAndSubject(pathName: string, subjectName: string): Promise<string | null> {
    const subject = await this.prisma.subject.findFirst({
      where: { name: subjectName },
      select: { id: true },
    });

    if (!subject) return null;

    const path = await this.prisma.path.findFirst({
      where: {
        name: pathName,
        subject_id: subject.id,
      },
      select: { id: true },
    });

    return path?.id ?? null;
  }

  async countQuestionsByExamDay(examDayId: string): Promise<number> {
    return this.prisma.question.count({
      where: { exam_day_id: examDayId },
    });
  }

  async countQuestionsByExam(examId: string): Promise<number> {
    return this.prisma.question.count({
      where: {
        exam_day: {
          exam_id: examId,
        },
      },
    });
  }

  async findAttemptResultGridById(attemptId: string, userId: string) {
    return this.prisma.attempt.findFirst({
      where: {
        id: attemptId,
        user_id: userId,
      },
      include: ATTEMPT_RESULT_GRID_INCLUDE,
    });
  }

  async findAllAttemptsByUser(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { user_id: userId },
      orderBy: [{ exam_id: 'asc' }, { init_time: 'desc' }],
      distinct: ['exam_id'],
      select: {
        exam_id: true,
        end_time: true,
        attempt_days: {
          select: {
            end_time: true,
            exam_day: {
              select: { day: true },
            },
            _count: {
              select: { answers: true },
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
