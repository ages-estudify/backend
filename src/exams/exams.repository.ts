import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Origin, ExamStatus } from '@prisma/client';

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

@Injectable()
export class ExamsRepository {
  constructor(private prisma: PrismaService) {}

  async findAllExams(take?: number, skip?: number) {
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
        image_url: null,
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
      image_url?: string | null;
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
