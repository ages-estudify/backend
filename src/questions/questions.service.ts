import { Injectable, NotFoundException } from '@nestjs/common';
import { QuestionBatchDataDto } from './dto/question-batch.dto';
import { QuestionResponse, QuestionsRepository } from './questions.repository';

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
  ): Promise<QuestionBatchDataDto> {
    if (!(await this.questions.pathExists(topicId))) {
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
      return this.buildEmptyResult();
    }

    return {
      data: this.buildResponseData(questions, current, total),
    };
  }

  private buildEmptyResult(): QuestionBatchDataDto {
    return {
      data: null,
      message: 'Todas as questões deste tipo foram respondidas neste tópico',
    };
  }

  private buildResponseData(
    questions: QuestionResponse[],
    current: number,
    total: number,
  ): QuestionBatchDataDto['data'] {
    return {
      questions: questions.map((q) => this.transformQuestion(q)),
      sessionProgress: {
        current,
        total,
      },
    };
  }

  private transformQuestion(question: QuestionResponse) {
    return {
      id: question.id,
      text: question.text,
      imageUrl: question.image_url,
      origin: this.mapOrigin(question.origin),
      subjectName: question.subjectName,
      topicName: question.topicName,
      alternatives: question.alternatives.map((alternative) => ({
        label: alternative.letter,
        text: alternative.text,
      })),
    };
  }

  private mapOrigin(origin: 'ORIGINAL' | 'EXTERNAL'): 'ORIGINAL' | 'SIMPLIFIED' {
    return origin === 'EXTERNAL' ? 'SIMPLIFIED' : 'ORIGINAL';
  }
}
