import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateAttemptDto } from './dto/update-attempt.dto';
import { AttemptResponseDto } from './dto/attempt-response.dto';
import { AttemptsRepository } from './attempts.repository';
import { Language } from '@prisma/client';

@Injectable()
export class AttemptsService {
  constructor(private readonly attemptsRepository: AttemptsRepository) {}

  async create(examId: string, userId: string, language: string) {
    const existingAttempt = await this.attemptsRepository.findActive(userId, examId);

    if (existingAttempt) {
      await this.finish(existingAttempt.id, userId);
    }

    const attempt = await this.attemptsRepository.create({
      user_id: userId,
      exam_id: examId,
      language: language as Language,
      init_time: new Date(),
      current_question: 1,
      time_spent_seconds: 0,
    });

    return { success: true, data: { attempt } };
  }

  async update(id: string, updateAttemptDto: UpdateAttemptDto, userId: string) {
    const attempt = await this.attemptsRepository.findByIdAndUser(id, userId);

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

    const updatedAttempt = await this.attemptsRepository.update(id, {
      current_question: updateAttemptDto.currentQuestion,
      time_spent_seconds: updateAttemptDto.timeSpentSeconds,
    });

    return { success: true, data: { attempt: updatedAttempt } };
  }

  async findLast(userId: string, examId: string) {
    const attempt = await this.attemptsRepository.findLastWithQuestions(userId, examId);

    if (!attempt) throw new NotFoundException('No active attempt found');

    const userAnswers = await this.attemptsRepository.findAnswersByAttemptId(attempt.id);

    const questions = this.formatQuestionsWithAnswers(attempt.exam.exam_days, userAnswers);

    const attemptResponse: AttemptResponseDto = {
      id: attempt.id,
      examId: attempt.exam_id,
      currentQuestion: attempt.current_question,
      timeSpentSeconds: attempt.time_spent_seconds,
      language: attempt.language,
      initTime: attempt.init_time,
      endTime: attempt.end_time,
    };

    return {
      success: true,
      data: {
        attempt: attemptResponse,
        questions,
      },
    };
  }

  async finish(id: string, userId: string) {
    const attempt = await this.attemptsRepository.findAttemptForFinish(id, userId);

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.end_time) throw new BadRequestException('Attempt already finished');

    const totalScore = await this.calculateAttemptScore(attempt, attempt.id);

    const updated = await this.attemptsRepository.update(id, {
      end_time: new Date(),
      score: totalScore.score,
    });

    return {
      success: true,
      data: {
        attemptId: updated.id,
        examId: updated.exam_id,
        timeSpentSeconds: updated.time_spent_seconds,
        endTime: updated.end_time,
        score: totalScore.score,
        ...totalScore.data,
      },
    };
  }

  private formatQuestionsWithAnswers(examDays: any[], userAnswers: any[]) {
    return examDays
      .flatMap((day) =>
        day.questions.map((q: any) => {
          const answer = userAnswers.find((a: any) => a.question_id === q.id);
          return {
            id: q.id,
            number: q.number,
            text: q.text,
            imageUrl: q.image_url,
            day: day.day,
            alternatives: q.alternatives.map((alt: any) => ({
              id: alt.id,
              letter: alt.letter,
              text: alt.text,
            })),
            selectedAlternativeId: answer?.alternative_id ?? null,
          };
        }),
      )
      .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  }

  private async calculateAttemptScore(attempt: any, id: string) {
    const userAnswers = await this.attemptsRepository.findAnswersByAttemptId(id);

    const subjectMap = new Map();

    const allQuestions = attempt.exam.exam_days.flatMap((day) => day.questions);

    allQuestions.forEach((q) => {
      const subject = q.path?.subject;
      if (!subject) throw new BadRequestException('Question must have a subject');

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

      const userAnswer = userAnswers.find((a) => a.question_id === q.id);
      const [correctAlternative] = q.alternatives;

      if (!correctAlternative) {
        throw new BadRequestException('Question must have a correct alternative');
      }

      const correctAlternativeId = correctAlternative.id;

      if (!userAnswer || !userAnswer.alternative_id) stats.blankAnswers++;
      else if (userAnswer.alternative_id === correctAlternativeId) stats.correctAnswers++;
      else stats.wrongAnswers++;
    });

    const resultBySubject = Array.from(subjectMap.values());

    const totalScore = resultBySubject.reduce((acc, curr) => acc + curr.correctAnswers, 0);

    const totalQuestions = resultBySubject.reduce((acc, curr) => acc + curr.totalQuestions, 0);
    const correctAnswers = resultBySubject.reduce((acc, curr) => acc + curr.correctAnswers, 0);
    const wrongAnswers = resultBySubject.reduce((acc, curr) => acc + curr.wrongAnswers, 0);
    const blankAnswers = resultBySubject.reduce((acc, curr) => acc + curr.blankAnswers, 0);
    const answeredQuestions = correctAnswers + wrongAnswers;

    return {
      score: totalScore,
      data: {
        totalQuestions: totalQuestions,
        answeredQuestions: answeredQuestions,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        blankAnswers: blankAnswers,
        resultBySubject: resultBySubject,
      },
    };
  }
}
