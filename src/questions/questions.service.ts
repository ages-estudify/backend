import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionBatchDataDto } from './dto/question-batch.dto';
import { QuestionResponse, QuestionsRepository } from './questions.repository';
import { AnswerSuccessResponseDto } from './dto/answer-response.dto';
import { GamificationService } from '../gamification/gamification.service';
import { UsersRepository } from '../users/users.repository';
import { QuestionMediaService } from '../storage/question-media.service';
import { StreakService } from '../streak/streak.service';
import { TrainingResultSuccessResponse } from './dto/training-result-response.dto';

@Injectable()
export class QuestionsService {
  constructor(
    private questionsRepository: QuestionsRepository,
    private gamificationService: GamificationService,
    private usersRepository: UsersRepository,
    private questionMedia: QuestionMediaService,
    private streakService: StreakService,
  ) {}

  async getQuestionBatch(
    topicId: string,
    type: string,
    limit: number,
    excludeAnswered: boolean,
    retrieveWrong: boolean,
    userId: string,
  ): Promise<QuestionBatchDataDto> {
    if (!(await this.questionsRepository.pathExists(topicId))) {
      throw new NotFoundException('Tópico não encontrado');
    }

    const total = await this.questionsRepository.countByPathAndType(topicId, type);
    const current = await this.questionsRepository.countAnsweredByUserInPath(userId, topicId, type);

    const questions = await this.questionsRepository.findByPathAndType(
      topicId,
      type,
      excludeAnswered,
      retrieveWrong,
      userId,
      limit,
    );

    if (questions.length === 0) {
      return this.buildEmptyResult();
    }

    return {
      data: await this.buildResponseData(questions, current, total),
    };
  }

  private buildEmptyResult(): QuestionBatchDataDto {
    return {
      data: null,
      message: 'Todas as questões deste tipo foram respondidas neste tópico',
    };
  }

  private async buildResponseData(
    questions: QuestionResponse[],
    current: number,
    total: number,
  ): Promise<QuestionBatchDataDto['data']> {
    const signedUrls = await this.questionMedia.resolveSignedUrls(
      questions.map((q) => q.media_key),
    );

    return {
      questions: questions.map((q, index) => this.transformQuestion(q, signedUrls[index])),
      sessionProgress: {
        current,
        total,
      },
    };
  }

  private transformQuestion(question: QuestionResponse, imageUrl: string | null) {
    return {
      id: question.id,
      text: question.text,
      imageUrl,
      origin: this.mapOrigin(question.origin),
      subjectName: question.subjectName,
      topicName: question.topicName,
      alternatives: question.alternatives.map((alternative) => ({
        label: alternative.letter,
        text: alternative.text,
      })),
    };
  }

  async questionFeedback(
    questionId: string,
    userId: string,
    selectedAnswer: string,
    attemptId?: string,
    timeSpentSeconds?: number,
  ): Promise<AnswerSuccessResponseDto> {
    const user = await this.usersRepository.findUniqueById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const question = await this.questionsRepository.findQuestionById(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const selectedAlternative = question.alternatives.find((alt) => alt.letter === selectedAnswer);
    if (!selectedAlternative) {
      throw new BadRequestException('Selected answer is not a valid alternative for this question');
    }

    if (attemptId) {
      const attempt = await this.questionsRepository.findAttemptByIdAndUser(attemptId, userId);

      if (!attempt) throw new NotFoundException('Attempt not found');

      if (attempt.end_time) throw new BadRequestException('Attempt already finished');

      if (timeSpentSeconds !== undefined && timeSpentSeconds < attempt.time_spent_seconds) {
        throw new BadRequestException('Time spent cannot regress');
      }

      if (!question.exam_day_id) {
        throw new BadRequestException('Question needs exam_day_id');
      }

      let attemptDay = await this.questionsRepository.findAttemptDay(
        attemptId,
        question.exam_day_id,
      );

      if (!attemptDay) {
        attemptDay = await this.questionsRepository.createAttemptDay({
          attempt_id: attemptId,
          exam_day_id: question.exam_day_id,
          time_spent_seconds: 0,
          current_question: question.number ?? 1,
          init_time: new Date(),
        });
      }

      const existingAnswer = await this.questionsRepository.findExistingAnswer(
        attemptDay.id,
        questionId,
      );

      if (existingAnswer) {
        await this.questionsRepository.updateAnswerAlternative(
          existingAnswer.id,
          selectedAlternative.id,
        );
      } else {
        await this.questionsRepository.createAnswer({
          attempt_day_id: attemptDay.id,
          question_id: questionId,
          user_id: userId,
          alternative_id: selectedAlternative.id,
          answer_date: new Date(),
        });
      }

      await this.questionsRepository.updateAttemptProgress(
        attemptId,
        timeSpentSeconds ?? attempt.time_spent_seconds,
        question.number ?? attempt.current_question + 1,
      );

      return { success: true, data: { saved: true } };
    }

    const correctAlternative = question.alternatives.find((alt) => alt.is_correct);
    if (!correctAlternative) {
      throw new BadRequestException('Question has no correct answer defined');
    }

    const isCorrect = selectedAnswer === correctAlternative.letter;

    await this.questionsRepository.createAnswer({
      user_id: userId,
      question_id: questionId,
      alternative_id: selectedAlternative.id,
      answer_date: new Date(),
    });

    const streakResult = await this.streakService.registerAnswer(userId);

    const gamificationResult = await this.gamificationService.earnCoins({
      userId,
      isCorrect,
      isSimulated: false,
    });

    return {
      success: true,
      data: {
        isCorrect,
        correctAnswer: correctAlternative.letter,
        explanation: question.feedback,
        coinsEarned: gamificationResult.coinsEarned,
        totalCoins: gamificationResult.totalCoins,
        streakDays: streakResult.streakDays,
        streakActive: streakResult.streakActive,
      },
    } as AnswerSuccessResponseDto;
  }

  private mapOrigin(origin: 'ORIGINAL' | 'EXTERNAL'): 'ORIGINAL' | 'SIMPLIFIED' {
    return origin === 'EXTERNAL' ? 'SIMPLIFIED' : 'ORIGINAL';
  }

  async trainingResult(
    userId: string,
    questionsIds: string[],
  ): Promise<TrainingResultSuccessResponse> {
    const user = await this.usersRepository.findUniqueById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar que todas as questões existem
    const questions = await this.questionsRepository.findQuestionsByIds(questionsIds);
    if (questions.length !== questionsIds.length) {
      throw new NotFoundException('Uma ou mais questões não foram encontradas');
    }

    // Buscar respostas de treino (attempt_day_id = null) do usuário
    const trainingAnswers = await this.questionsRepository.getTrainingAnswersForQuestions(
      userId,
      questionsIds,
    );

    // Validar que todas as questões foram respondidas (sessão completa)
    const answeredQuestionIds = new Set(trainingAnswers.map((answer) => answer.question_id));
    const missingAnswers = questionsIds.filter((id) => !answeredQuestionIds.has(id));
    if (missingAnswers.length > 0) {
      throw new BadRequestException('Sessão incompleta: nem todas as questões foram respondidas');
    }

    // Pegar apenas a resposta mais recente por questão
    const latestAnswersByQuestion = new Map();
    trainingAnswers.forEach((answer) => {
      if (!latestAnswersByQuestion.has(answer.question_id)) {
        latestAnswersByQuestion.set(answer.question_id, answer);
      }
    });

    // Contar respostas corretas
    const correctAnswers = Array.from(latestAnswersByQuestion.values()).filter(
      (answer) => answer.alternative?.is_correct,
    ).length;

    const totalQuestions = questionsIds.length;
    const wrongAnswers = totalQuestions - correctAnswers;

    return {
      success: true,
      data: {
        totalQuestions,
        correctAnswers,
        wrongAnswers,
      },
    };
  }
}
