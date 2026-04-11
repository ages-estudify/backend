import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionsRepository } from './questions.repository';
import { AnswerSuccessResponseDto } from './dto/answer-response.dto';
import { GamificationService } from '../gamification/gamification.service';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class QuestionsService {
  constructor(
    private questionsRepository: QuestionsRepository,
    private gamificationService: GamificationService,
    private usersRepository: UsersRepository,
  ) {}

  async questionFeedback(
    questionId: string,
    userId: string,
    selectedAnswer: string,
  ): Promise<AnswerSuccessResponseDto> {
    const user = await this.usersRepository.findUniqueById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

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

    const gamificationResult = await this.gamificationService.earnCoins({
      userId,
      isCorrect,
      isSimulated: !!question.exam_id,
    });

    return {
      success: true,
      data: {
        isCorrect,
        correctAnswer: correctAlternative.letter,
        explanation: question.feedback,
        coinsEarned: gamificationResult.coinsEarned,
        totalCoins: gamificationResult.totalCoins,
      },
    } as AnswerSuccessResponseDto;
  }
}
