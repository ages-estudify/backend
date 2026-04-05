import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export type QuestionResponse = {
  id: string;
  text: string;
  image_url: string | null;
  origin: string;
  alternatives: {
    id: string;
    text: string;
    letter: string;
    is_correct: boolean;
  }[];
};

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPathAndType(
    pathId: string,
    type: string,
    excludeAnswered: boolean,
    userId?: string,
    limit?: number,
  ): Promise<QuestionResponse[]> {
    const limitNum = limit || 10;

    if (excludeAnswered || !userId) {
      const where: any = {
        path_id: pathId,
        origin: type === 'SIMPLIFIED' ? 'EXTERNAL' : 'ORIGINAL',
      };

      if (excludeAnswered && userId) {
        where.answers = {
          none: {
            user_id: userId,
          },
        };
      }

      const questions = await this.prisma.question.findMany({
        where,
        include: {
          alternatives: {
            select: {
              id: true,
              text: true,
              letter: true,
              is_correct: true,
            },
          },
        },
      });

      const shuffled = questions.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limitNum);
    } else {
      const unansweredQuestions = await this.prisma.question.findMany({
        where: {
          path_id: pathId,
          origin: type === 'SIMPLIFIED' ? 'EXTERNAL' : 'ORIGINAL',
          answers: {
            none: {
              user_id: userId,
            },
          },
        },
        include: {
          alternatives: {
            select: {
              id: true,
              text: true,
              letter: true,
              is_correct: true,
            },
          },
        },
      });

      let result = [...unansweredQuestions];

      if (result.length < limitNum) {
        const answeredQuestions = await this.prisma.question.findMany({
          where: {
            path_id: pathId,
            origin: type === 'SIMPLIFIED' ? 'EXTERNAL' : 'ORIGINAL',
            answers: {
              some: {
                user_id: userId,
              },
            },
          },
          include: {
            alternatives: {
              select: {
                id: true,
                text: true,
                letter: true,
                is_correct: true,
              },
            },
          },
        });

        const shuffledAnswered = answeredQuestions.sort(() => Math.random() - 0.5);
        result = result.concat(shuffledAnswered.slice(0, limitNum - result.length));
      }

      const shuffled = result.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limitNum);
    }
  }

  async countByPathAndType(pathId: string, type: string): Promise<number> {
    return this.prisma.question.count({
      where: {
        path_id: pathId,
        origin: type === 'SIMPLIFIED' ? 'EXTERNAL' : 'ORIGINAL',
      },
    });
  }

  async countAnsweredByUserInPath(userId: string, pathId: string, type: string): Promise<number> {
    return this.prisma.answer.count({
      where: {
        user_id: userId,
        question: {
          path_id: pathId,
          origin: type === 'SIMPLIFIED' ? 'EXTERNAL' : 'ORIGINAL',
        },
      },
    });
  }

  async pathExists(pathId: string): Promise<boolean> {
    const path = await this.prisma.path.findUnique({
      where: { id: pathId },
    });
    return !!path;
  }
}
