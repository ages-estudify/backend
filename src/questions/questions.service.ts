import { Injectable, NotFoundException } from '@nestjs/common';
import { QuestionsRepository } from './questions.repository';

@Injectable()
export class QuestionsService {
  constructor(private readonly questions: QuestionsRepository) {}

  async getQuestionBatch(
    topicId: string,
    type: string,
    limit: number,
    excludeAnswered: boolean,
    retrieveWrong: boolean,
    userId: string,
  ) {
    const pathExists = await this.questions.pathExists(topicId);
    if (!pathExists) {
      throw new NotFoundException('Tópico não encontrado');
    }

    const total = await this.questions.countByPathAndType(topicId, type);
    const current = await this.questions.countAnsweredByUserInPath(userId, topicId, type);

    const questions = await this.questions.findByPathAndType(
      topicId,
      type,
      excludeAnswered,
      retrieveWrong,
      userId,
      limit,
    );

    if (questions.length === 0) {
      return {
        data: null,
        message: 'Todas as questões deste tipo foram respondidas neste tópico',
      };
    }

    const transformedQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text,
      imageUrl: q.image_url,
      type: type as 'ORIGINAL' | 'SIMPLIFIED',
      alternatives: q.alternatives.map((a) => ({
        label: a.letter,
        text: a.text,
      })),
    }));

    return {
      data: {
        questions: transformedQuestions,
        sessionProgress: {
          current,
          total,
        },
      },
    };
  }
}
