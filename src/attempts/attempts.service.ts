import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateAttemptDto } from './dto/update-attempt.dto';

@Injectable()
export class AttemptsService {
  constructor(private prisma: PrismaService) {}

  async create(examId: string, userId: string, language: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });

    if (!exam) {
      throw new NotFoundException('Exame informado não existe.');
    }

    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        user_id: userId,
        exam_id: examId,
        end_time: null,
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    const attempt = await this.prisma.attempt.create({
      data: {
        user_id: userId,
        exam_id: examId,
        language: language as any,
        init_time: new Date(),
        current_question: 1,
        time_spent_minutes: 0,
      },
    });
    return attempt;
  }

  async update(id: string, updateAttemptDto: UpdateAttemptDto) {
    try {
      return await this.prisma.attempt.update({
        where: { id },
        data: {
          current_question: updateAttemptDto.current_question,
          time_spent_minutes: updateAttemptDto.time_spent_minutes,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Attempt com id ${id} não encontrada`);
      }
      throw error;
    }
  }

  async findLast(userId: string) {
    return await this.prisma.attempt.findFirst({
      where: {
        user_id: userId,
        end_time: null,
      },
      orderBy: {
        init_time: 'desc',
      },
    });
  }

  async finish(id: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                alternatives: { where: { is_correct: true } },
                path: { include: { subject: true } },
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException(`Attempt com id ${id} não encontrada`);

    const userAnswers = await this.prisma.answer.findMany({
      where: { attempt_id: id },
    });

    const subjectMap = new Map();

    attempt.exam.questions.forEach((q) => {
      const subject = q.path?.subject;
      if (!subject) return;

      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subjectId: subject.id,
          subjectName: subject.name,
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          blankAnswers: 0,
        });
      }

      const stats = subjectMap.get(subject.id);
      stats.totalQuestions++;

      const answer = userAnswers.find((a) => a.question_id === q.id);

      if (!answer) {
        stats.blankAnswers++;
      } else {
        const isCorrect = answer.alternative_id === q.alternatives[0]?.id;
        if (isCorrect) stats.correctAnswers++;
        else stats.wrongAnswers++;
      }
    });

    const resultBySubject = Array.from(subjectMap.values());

    const totalScore = resultBySubject.reduce((acc, curr) => acc + curr.correctAnswers, 0);

    try {
      const updated = await this.prisma.attempt.update({
        where: { id },
        data: {
          end_time: new Date(),
          score: totalScore,
        },
      });

      return { ...updated, resultBySubject };
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundException('Attempt não encontrada');
      throw error;
    }
  }
}
