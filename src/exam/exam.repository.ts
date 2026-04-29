import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExamRepository {
  constructor(private prisma: PrismaService) {}

  async findAllWithLastAttemptByUser(userId: string) {
    const result = await this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        image_url: string;
        origin: string;
        status: 'in_progress' | 'completed' | 'available';
        language: 'ENGLISH' | 'SPANISH';
        totalQuestions: number;
        totalQuestions1: number;
        totalQuestions2: number;
        answeredQuestions: number;
        answeredQuestions1: number;
        answeredQuestions2: number;
        isCompleted1: boolean;
        isCompleted2: boolean;
      }[]
    >`
       WITH last_attempt AS (
          SELECT DISTINCT ON (a.exam_id)
            a.id,
            a.exam_id,
            a.end_time
          FROM "Attempt" a
          WHERE a.user_id = ${userId}
          ORDER BY a.exam_id, a.init_time DESC
        ),

        attempt_days AS (
          SELECT
            ad.attempt_id,

            BOOL_OR(ad.end_time IS NOT NULL) FILTER (WHERE ed.day = 1) AS is_completed_1,
            BOOL_OR(ad.end_time IS NOT NULL) FILTER (WHERE ed.day = 2) AS is_completed_2

          FROM "AttemptDay" ad
          JOIN "ExamDay" ed ON ed.id = ad.exam_day_id
          JOIN last_attempt la ON la.id = ad.attempt_id
          GROUP BY ad.attempt_id
        ),

        answer_stats AS (
        SELECT
          ad.attempt_id,

          COUNT(DISTINCT aw.id) FILTER (
            WHERE aw.alternative_id IS NOT NULL AND ed.day = 1
          )::int AS answered_questions1,

          COUNT(DISTINCT aw.id) FILTER (
            WHERE aw.alternative_id IS NOT NULL AND ed.day = 2
          )::int AS answered_questions2

        FROM "AttemptDay" ad
        LEFT JOIN "Answer" aw ON aw.attempt_day_id = ad.id
        JOIN "ExamDay" ed ON ed.id = ad.exam_day_id
        JOIN last_attempt la ON la.id = ad.attempt_id

        GROUP BY ad.attempt_id
      ),

         question_stats AS (
          SELECT
            e.id AS exam_id,
            COUNT(q.id)::int AS total,
            COUNT(q.id) FILTER (WHERE ed.day = 1)::int AS total1,
            COUNT(q.id) FILTER (WHERE ed.day = 2)::int AS total2
          FROM "Exam" e
          LEFT JOIN "ExamDay" ed ON ed.exam_id = e.id
          LEFT JOIN "Question" q ON q.exam_day_id = ed.id
          GROUP BY e.id
        )

        SELECT
            e.id,
            e.name,
            e.image_url,
            e.origin,

            CASE
              WHEN la.id IS NULL THEN 'available'
              WHEN la.end_time IS NULL THEN 'in_progress'
              ELSE 'completed'
            END AS status,

            qs.total AS "totalQuestions",
            qs.total1 AS "totalQuestions1",
            qs.total2 AS "totalQuestions2",

            COALESCE(at.answered_questions1, 0) + COALESCE(at.answered_questions2, 0) AS "answeredQuestions",

            COALESCE(at.answered_questions1, 0) AS "answeredQuestions1",
            COALESCE(at.answered_questions2, 0) AS "answeredQuestions2",

            COALESCE(ad.is_completed_1, false) AS "isCompleted1",
            COALESCE(ad.is_completed_2, false) AS "isCompleted2"

          FROM "Exam" e

          LEFT JOIN last_attempt la ON la.exam_id = e.id
          LEFT JOIN attempt_days ad ON ad.attempt_id = la.id
          LEFT JOIN answer_stats at ON at.attempt_id = la.id
          LEFT JOIN question_stats qs ON qs.exam_id = e.id
          WHERE e.status = 'PUBLISHED';
            `;

    return result;
  }
}
