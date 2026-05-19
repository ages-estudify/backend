import { Injectable } from '@nestjs/common';
import { Language, Origin, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

const QUESTION_INCLUDE = {
  alternatives: true,
  path: true,
  exam: true,
} as const;

export type PersistenceAlternative = { letter: string; text: string; is_correct: boolean };

export type CreateQuestionPersistenceInput = {
  discipline: string;
  content: string;
  bank?: string | null;
  text: string;
  feedback: string;
  year: number;
  origin: Origin;
  path_id: string;
  exam_id?: string | null;
  media_key?: string | null;
  number?: number | null;
  language?: Language | null;
  alternatives: PersistenceAlternative[];
};

@Injectable()
export class AdminQuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionPersistenceInput) {
    const question = await this.prisma.question.create({
      data: {
        discipline: dto.discipline,
        content: dto.content,
        bank: dto.bank ?? null,
        text: dto.text,
        feedback: dto.feedback,
        media_key: dto.media_key ?? null,
        number: dto.number ?? null,
        year: dto.year,
        language: dto.language ?? null,
        origin: dto.origin,
        path: { connect: { id: dto.path_id } },
        exam: dto.exam_id ? { connect: { id: dto.exam_id } } : undefined,
      },
    });

    for (const alt of dto.alternatives) {
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
      include: QUESTION_INCLUDE,
    });
  }

  async findMany(where: Prisma.QuestionWhereInput, skip: number, take: number) {
    const [content, totalElements] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take,
        include: QUESTION_INCLUDE,
        orderBy: [{ updatedAt: 'desc' }, { year: 'desc' }],
      }),
      this.prisma.question.count({ where }),
    ]);
    return { content, totalElements };
  }

  async findById(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: QUESTION_INCLUDE,
    });
  }

  async update(id: string, data: Prisma.QuestionUpdateInput) {
    return this.prisma.question.update({
      where: { id },
      data,
      include: QUESTION_INCLUDE,
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

  async getFallbackPathId(): Promise<string | null> {
    const path = await this.prisma.path.findFirst({
      orderBy: { schedule_position: 'asc' },
    });
    return path?.id ?? null;
  }

  async examExists(id: string): Promise<boolean> {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    return !!exam;
  }
}
