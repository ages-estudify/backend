import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminQuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    questionData: {
      text: string;
      feedback: string;
      image: string | null;
      number: number | null;
      year: number;
      day: number | null;
      language: any;
      origin: any;
      path_id: string;
      exam_id?: string | null;
    },
    alternatives: { letter: string; text: string; is_correct: boolean }[],
  ) {
    const question = await this.prisma.question.create({
      data: {
        text: questionData.text,
        feedback: questionData.feedback,
        image: questionData.image,
        number: questionData.number,
        year: questionData.year,
        day: questionData.day,
        language: questionData.language,
        origin: questionData.origin,
        path: { connect: { id: questionData.path_id } },
        exam: questionData.exam_id ? { connect: { id: questionData.exam_id } } : undefined,
      },
    });

    for (const alt of alternatives) {
      await this.prisma.alternative.create({
        data: {
          letter: alt.letter,
          text: alt.text,
          is_correct: alt.is_correct,
          question: { connect: { id: question.id } },
        },
      });
    }

    return this.prisma.question.findUnique({
      where: { id: question.id },
      include: { alternatives: true, path: true, exam: true },
    });
  }

  async findMany(where: Prisma.QuestionWhereInput, skip: number, take: number) {
    const [content, totalElements] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take,
        include: { alternatives: true, path: true, exam: true },
        orderBy: { year: 'desc' },
      }),
      this.prisma.question.count({ where }),
    ]);
    return { content, totalElements };
  }

  async findById(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: { alternatives: true, path: true, exam: true },
    });
  }

  async update(id: string, data: Prisma.QuestionUpdateInput) {
    return this.prisma.question.update({
      where: { id },
      data,
      include: { alternatives: true, path: true, exam: true },
    });
  }

  async deleteAlternatives(questionId: string) {
    return this.prisma.alternative.deleteMany({
      where: { question_id: questionId },
    });
  }

  async createAlternative(data: Prisma.AlternativeCreateInput) {
    return this.prisma.alternative.create({ data });
  }

  async findAllPaths() {
    return this.prisma.path.findMany({
      include: { subject: true },
      orderBy: { schedule_position: 'asc' },
    });
  }

  async findAllExams() {
    return this.prisma.exam.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async pathExists(id: string): Promise<boolean> {
    const path = await this.prisma.path.findUnique({ where: { id } });
    return !!path;
  }

  async examExists(id: string): Promise<boolean> {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    return !!exam;
  }
}
