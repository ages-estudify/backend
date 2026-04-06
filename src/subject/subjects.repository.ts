import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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

  async findAllWithAnsweredByUser(userId: string) {
    const result = await this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        icon: string;
        totalQuestions: number;
        answeredQuestions: number;
      }[]
    >`
      SELECT 
        s.id,
        s.name,
        s.icon_url AS icon,

        COUNT(DISTINCT q.id)::int AS "totalQuestions",

        COUNT(DISTINCT a.question_id)::int AS "answeredQuestions"

      FROM "Subject" s

      LEFT JOIN "Path" p 
        ON p.subject_id = s.id

      LEFT JOIN "Question" q 
        ON q.path_id = p.id
        AND q.exam_id IS NULL

      LEFT JOIN "Answer" a
        ON a.question_id = q.id
        AND a.user_id = ${userId}

      GROUP BY s.id, s.name, s.icon_url

      HAVING COUNT(DISTINCT q.id) > 0
    `;

    return result;
  }

  async findAllPathsBySubject(id: string, userId: string) {
    const result = await this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        text: string;
        icon: string;
        availableByType: {
          ORIGINAL: number;
          EXTERNAL: number;
        };
        answeredByType: {
          ORIGINAL: number;
          EXTERNAL: number;
        };
      }[]
    >`SELECT
              p.id,
              p.name,
              p.text,
              p.icon_url AS icon,

              JSON_BUILD_OBJECT(
                'ORIGINAL', COUNT(q.id) FILTER (WHERE q.origin = 'ORIGINAL'),
                'EXTERNAL', COUNT(q.id) FILTER (WHERE q.origin = 'EXTERNAL')
              ) AS "availableByType",

              JSON_BUILD_OBJECT(
                'ORIGINAL', COUNT(a.id) FILTER (WHERE q.origin = 'ORIGINAL'),
                'EXTERNAL', COUNT(a.id) FILTER (WHERE q.origin = 'EXTERNAL')
              ) AS "answeredByType"

            FROM "Path" p
            LEFT JOIN "Question" q ON q.path_id = p.id
            LEFT JOIN "Answer" a 
              ON a.question_id = q.id 
            AND a.user_id = ${userId}

            WHERE p.subject_id = ${id}

            GROUP BY p.id, p.name, p.text
            ORDER BY p.trail_position;
          `;

    return result;
  }

  async countByPathAndType(pathId: string, type: string, userId: string) {
    const result = await this.prisma.$queryRaw<{ total: number; answered: number }[]>`
  SELECT 
    COUNT(q.id)::int AS total,
    COUNT(DISTINCT a."question_id")::int AS answered
  FROM "Question" q
  LEFT JOIN "Answer" a 
    ON a."question_id" = q.id 
    AND a."user_id" = ${userId}
  WHERE 
    q."path_id" = ${pathId}
    AND q.origin = ${type};
`;

    return result[0] ?? { total: 0, answered: 0 };
  }
}
