import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionsRepository } from './questions.repository';
import { AnswerSuccessResponseDto } from './dto/answer-response.dto';

@Injectable()
export class QuestionsService {
  constructor(private questionsRepository: QuestionsRepository) {}

  async questionFeedback(
    questionId: string,
    userId: string,
    selectedAnswer: string,
  ): Promise<AnswerSuccessResponseDto> {
    const question = await this.questionsRepository.findQuestionById(questionId);

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const correctAlternative = question.alternatives.find((alt) => alt.is_correct);
    if (!correctAlternative) {
      throw new BadRequestException('Question has no correct answer defined');
    }

    const isCorrect = selectedAnswer === correctAlternative.letter;

    const selectedAlternative = question.alternatives.find((alt) => alt.letter === selectedAnswer);
    if (!selectedAlternative) {
      throw new BadRequestException('Selected answer is not a valid alternative for this question');
    }

    await this.questionsRepository.createAnswer({
      user_id: userId,
      question_id: questionId,
      alternative_id: selectedAlternative.id,
      answer_date: new Date(),
    });

    return {
      success: true,
      data: {
        isCorrect,
        correctAnswer: correctAlternative.letter,
        explanation: question.feedback,
      },
    } as AnswerSuccessResponseDto;
  }
}
