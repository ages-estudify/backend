import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import strict from 'assert/strict';

@Injectable()
export class ExamRepository {
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

  async findAllWithLastAttemptByUser(userId: string) {
    const result = await this.prisma.$queryRaw<
      {
      id: string
      name: string
      totalQuestions: number
      origin: string
      image_url: string
      status: 'completed' | 'in_progress' | 'not_started';
      answeredQuestions: number
      totalQuestions1: number
      isCompleted1: boolean,
      totalQuestions2: number
      isCompleted2: boolean
      language: 'ENGLISH' | 'SPANISH';

    }[]
    >`
    SELECT
      e.id,
      e.name,
      e.image_url,
      e.origin,
      a.language,
      a.day1_completed AS "isCompleted1",
      a.day2_completed AS "isCompleted2",

      COUNT(DISTINCT q.id)::int AS "totalQuestions",

      COUNT(DISTINCT q.id) FILTER (WHERE q.day = 1)::int AS "totalQuestions1",
      COUNT(DISTINCT q.id) FILTER (WHERE q.day = 2)::int AS "totalQuestions2",
      COUNT(DISTINCT w.id) FILTER (WHERE w.alternative_id IS NOT NULL)::int AS "answeredQuestions",

      CASE
        WHEN a.id IS NULL THEN 'available'
        WHEN a.end_time IS NULL THEN 'in_progress'
        ELSE 'completed'
      END AS "status"
      

      FROM "Exam" e

      JOIN "Question" q ON q.exam_id = e.id
    
      LEFT JOIN (
        SELECT DISTINCT ON (a.exam_id)
          a.*
        FROM "Attempt" a
        WHERE a.user_id = ${userId}
        ORDER BY a.exam_id, a.init_time DESC
      ) a ON a.exam_id = e.id

      LEFT JOIN "Answer"  w ON w.attempt_id = a.id

      GROUP BY e.id, e.name, e.image_url, e.origin, a.id, a.end_time,a.language,a.day1_completed,a.day2_completed;
    `;

    return result;
  }


}
