import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubjectPathDto } from './dto/allPathsBySubject.dto';
import { SubjectListingDto } from './dto/subjectListing.dto.';
import { Origin } from '@prisma/client';
import { CountByPathAndTypeDto } from './dto/countByPathAndType.dto';

@Injectable()
export class SubjectRepository {
  constructor(private prisma: PrismaService) {}

  async existsSubjectById(subjectId: string): Promise<boolean> {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });

    return !!subject;
  }

  async existsPathById(pathId: string): Promise<boolean> {
    const path = await this.prisma.path.findUnique({
      where: { id: pathId },
      select: { id: true },
    });

    return !!path;
  }

  async findAllWithAnsweredByUser(userId: string): Promise<SubjectListingDto[]> {
    const query = await this.prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        icon_url: true,
        paths: {
          select: {
            questions: {
              where: {
                exam_day_id: null,
              },
              select: {
                id: true,
                answers: {
                  where: {
                    user_id: userId,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const data: SubjectListingDto[] = query.map((subject) => {
      let totalQuestions = 0;
      let answeredQuestions = 0;

      subject.paths.forEach((path) => {
        totalQuestions += path.questions.length;

        answeredQuestions += path.questions.filter(
          (question) => question.answers.length > 0,
        ).length;
      });

      return {
        id: subject.id,
        name: subject.name,
        icon: subject.icon_url,
        totalQuestions,
        answeredQuestions,
      };
    });

    return data;
  }

  async findAllPathsBySubject(id: string, userId: string): Promise<SubjectPathDto[]> {
    const query = await this.prisma.path.findMany({
      where: {
        subject_id: id,
      },
      select: {
        id: true,
        name: true,
        text: true,
        icon_url: true,
        questions: {
          where: {
            exam_day_id: null,
          },
          select: {
            origin: true,
            answers: {
              where: {
                user_id: userId,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const data: SubjectPathDto[] = query.map((path) => {
      const availableByType = {
        ORIGINAL: 0,
        EXTERNAL: 0,
      };

      const answeredByType = {
        ORIGINAL: 0,
        EXTERNAL: 0,
      };

      path.questions.forEach((question) => {
        availableByType[question.origin]++;

        if (question.answers.length > 0) {
          answeredByType[question.origin]++;
        }
      });

      return {
        id: path.id,
        name: path.name,
        text: path.text,
        icon: path.icon_url,

        availableByType,
        answeredByType,
      };
    });

    return data;
  }

  async countByPathAndType(
    pathId: string,
    userId: string,
    type?: 'ORIGINAL' | 'EXTERNAL',
  ): Promise<CountByPathAndTypeDto> {
    const query = await this.prisma.path.findMany({
      where: {
        id: pathId,
      },
      select: {
        questions: {
          where: {
            exam_day_id: null,
            ...(type && {
              origin: type as Origin,
            }),
          },
          select: {
            id: true,
            answers: {
              where: {
                user_id: userId,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const result = query[0];

    const questions = result.questions.length;

    const answered = result.questions.filter((q) => q.answers.length > 0).length;

    return { total: questions, answered: answered };
  }
}
