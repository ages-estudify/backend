import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { AttemptDayResultDataDto } from './dto/attempt-day-result-data.dto';
import type { AttemptDayResultQuestionDto } from './dto/attempt-day-result-question.dto';
import { AttemptDaysRepository } from './attempt-days.repository';
import { QuestionMediaService } from '../storage/question-media.service';

@Injectable()
export class AttemptDaysService {
  constructor(
    private readonly attemptDaysRepository: AttemptDaysRepository,
    private readonly questionMedia: QuestionMediaService,
  ) {}

  async getAttemptDayResult(
    attemptDayId: string,
    userId: string,
  ): Promise<{ success: true; data: AttemptDayResultDataDto }> {
    const attemptDay = await this.attemptDaysRepository.findAttemptDayForUserResult(
      attemptDayId,
      userId,
    );

    if (!attemptDay) {
      throw new NotFoundException('Result not found');
    }

    if (!attemptDay.end_time) {
      throw new BadRequestException('Attempt day not finished yet');
    }

    const questions = await this.attemptDaysRepository.findQuestionsByExamDayId(
      attemptDay.exam_day_id,
    );

    const answerByQuestionId = this.latestAnswerByQuestionId(attemptDay.answers);

    const answers = attemptDay.answers;
    const answeredQuestions = answers.filter((a) => a.alternative_id != null).length;
    const correctAnswers = answers.filter((a) => a.alternative?.is_correct === true).length;
    const wrongAnswers = answers.filter(
      (a) => a.alternative_id != null && a.alternative != null && !a.alternative.is_correct,
    ).length;

    const totalQuestions = questions.length;
    const blankAnswers = totalQuestions - answeredQuestions;

    const signedUrls = await this.questionMedia.resolveSignedUrls(
      questions.map((q) => q.media_key),
    );

    const questionItems: AttemptDayResultQuestionDto[] = questions.map((q, index) => {
      const sortedAlts = [...q.alternatives].sort((a, b) => a.letter.localeCompare(b.letter));
      const correctAlt = sortedAlts.find((alt) => alt.is_correct);
      if (!correctAlt) {
        throw new InternalServerErrorException(`Question ${q.id} has no correct alternative`);
      }
      const answer = answerByQuestionId.get(q.id);
      const imageUrl = signedUrls[index];
      return {
        id: q.id,
        number: q.number ?? 0,
        text: q.text,
        imageUrl,
        alternatives: sortedAlts.map((alt) => ({
          id: alt.id,
          letter: alt.letter,
          text: alt.text,
        })),
        selectedAlternativeId: answer?.alternative_id ?? null,
        correctAlternativeId: correctAlt.id,
        feedback: q.feedback,
      };
    });

    const data: AttemptDayResultDataDto = {
      attemptDayId: attemptDay.id,
      attemptId: attemptDay.attempt_id,
      examId: attemptDay.attempt.exam_id,
      examDayId: attemptDay.exam_day_id,
      name: attemptDay.attempt.exam.name,
      day: attemptDay.exam_day.day,
      timeSpentSeconds: attemptDay.time_spent_seconds,
      endTime: attemptDay.end_time.toISOString(),
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      wrongAnswers,
      blankAnswers,
      questions: questionItems,
    };

    return { success: true, data };
  }

  private latestAnswerByQuestionId<
    T extends {
      question_id: string;
      answer_date: Date;
      alternative_id: string | null;
      alternative: { is_correct: boolean } | null;
    },
  >(answers: T[]): Map<string, T> {
    const sorted = [...answers].sort((a, b) => b.answer_date.getTime() - a.answer_date.getTime());
    const map = new Map<string, T>();
    for (const a of sorted) {
      if (!map.has(a.question_id)) {
        map.set(a.question_id, a);
      }
    }
    return map;
  }
}
