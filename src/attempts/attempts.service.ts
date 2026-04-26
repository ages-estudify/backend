import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateAttemptDto } from './dto/update-attempt.dto';

@Injectable()
export class AttemptsService {
  constructor(private prisma: PrismaService) {}

  async create(examId: string, userId: string, language: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam does not exist.');
    }

    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        user_id: userId,
        exam_id: examId,
        end_time: null,
      },
    });

    if (existingAttempt) {
      await this.finish(existingAttempt.id, userId);
    }

    const attempt = await this.prisma.attempt.create({
      data: {
        user_id: userId,
        exam_id: examId,
        language: language as any,
        init_time: new Date(),
        current_question: 1,
        time_spent_seconds: 0,
      },
    });

    return { success: true, data: { attempt } };
  }

  async update(id: string, updateAttemptDto: UpdateAttemptDto, userId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt not found`);
    }

    if (attempt.end_time) {
      throw new BadRequestException('Attempt already finished');
    }

    if (
      updateAttemptDto.timeSpentSeconds !== undefined &&
      updateAttemptDto.timeSpentSeconds < attempt.time_spent_seconds
    ) {
      throw new BadRequestException('Time spent cannot regress');
    }

    const updatedAttempt = await this.prisma.attempt.update({
      where: { id },
      data: {
        current_question: updateAttemptDto.current_question,
        time_spent_seconds: updateAttemptDto.timeSpentSeconds,
      },
    });

    return { success: true, data: { attempt: updatedAttempt } };
  }

  async findLast(userId: string, examId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { user_id: userId, exam_id: examId },
      orderBy: { init_time: 'desc' },
      include: {
        exam: {
          include: {
            exam_days: {
              include: {
                questions: {
                  include: { alternatives: true },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.end_time !== null) {
      throw new NotFoundException('No current attempt could be found');
    }

    const userAnswers = await this.prisma.answer.findMany({
      where: { attempt_day: { attempt_id: attempt.id } },
    });

    const questions = attempt.exam.exam_days
      .flatMap((day) =>
        day.questions.map((q) => {
          const answer = userAnswers.find((a) => a.question_id === q.id);
          return {
            id: q.id,
            number: q.number,
            text: q.text,
            imageUrl: q.image_url,
            day: day.day,
            alternatives: q.alternatives.map((alt) => ({
              id: alt.id,
              letter: alt.letter,
              text: alt.text,
            })),
            selectedAlternativeId: answer?.alternative_id ?? null,
          };
        }),
      )
      .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

    return {
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          examId: attempt.exam_id,
          currentQuestion: attempt.current_question,
          timeSpentSeconds: attempt.time_spent_seconds,
          language: attempt.language,
          initTime: attempt.init_time,
          endTime: attempt.end_time,
        },
        questions,
      },
    };
  }

  async finish(id: string, userId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        id,
        user_id: userId,
      },
      include: {
        exam: {
          include: {
            exam_days: {
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
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.end_time) throw new BadRequestException('Attempt already finished');

    const userAnswers = await this.prisma.answer.findMany({
      where: {
        attempt_day: {
          attempt_id: id,
        },
      },
    });

    const subjectMap = new Map();

    const allQuestions = attempt.exam.exam_days.flatMap((day) => day.questions);

    allQuestions.forEach((q) => {
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

      if (!answer || !answer.alternative_id) stats.blankAnswers++;
      else if (answer.alternative_id === q.alternatives[0]?.id) stats.correctAnswers++;
      else stats.wrongAnswers++;
    });

    const resultBySubject = Array.from(subjectMap.values());

    const totalScore = resultBySubject.reduce((acc, curr) => acc + curr.correctAnswers, 0);

    const totalQuestions = resultBySubject.reduce((acc, curr) => acc + curr.totalQuestions, 0);
    const correctAnswers = resultBySubject.reduce((acc, curr) => acc + curr.correctAnswers, 0);
    const wrongAnswers = resultBySubject.reduce((acc, curr) => acc + curr.wrongAnswers, 0);
    const blankAnswers = resultBySubject.reduce((acc, curr) => acc + curr.blankAnswers, 0);
    const answeredQuestions = correctAnswers + wrongAnswers;

    try {
      const updated = await this.prisma.attempt.update({
        where: { id },
        data: {
          end_time: new Date(),
          score: totalScore,
        },
      });

      return {
        success: true,
        data: {
          attemptId: updated.id,
          examId: updated.exam_id,
          timeSpentSeconds: updated.time_spent_seconds,
          endTime: updated.end_time,
          score: totalScore,
          totalQuestions,
          answeredQuestions,
          correctAnswers,
          wrongAnswers,
          blankAnswers,
          resultBySubject, // A lista separada por matéria vai aqui dentro!
        },
      };
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundException('Attempt não encontrada');
      throw error;
    }
  }
}
