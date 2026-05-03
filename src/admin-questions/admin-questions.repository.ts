import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class AdminQuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto) {
    const question = await this.prisma.question.create({
      data: {
        text: dto.text,
        feedback: dto.feedback,
        image: dto.image ?? null,
        number: dto.number ?? null,
        year: dto.year,
        day: dto.day ?? null,
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
