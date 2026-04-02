import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';


@Injectable()
export class SubjectRepository {
  constructor(private prisma: PrismaService) {}

async findAllWithAnsweredByUser() {
   const result = await this.prisma.$queryRaw<
    {
      id: string;
      name: string;
      icon: string
      totalQuestions: number,
      answeredQuestions: number
    }[]
  >`
   SELECT 
  s.id,
  s.name,
  s.icon_url,

  COUNT(q.id) FILTER (WHERE q.origin = 'ORIGINAL')::int AS "totalQuestions"

  FROM "Subject" s

LEFT JOIN "Path" p 
  ON p.subject_id = s.id

LEFT JOIN "Question" q 
  ON q.path_id = p.id
  AND q.exam_id IS NULL
  
  GROUP BY s.id, s.name, s.icon_url `;


  return result;
 
}

async findAllPathsBySubject(id: string) {
  const result = await this.prisma.$queryRaw<
    {
      id: string;
      name: string;
      text: string;
      availableByType: {
        ORIGINAL: number;
        EXTERNAL: number;
      };
    }[]
  >`
    SELECT 
      p.id,
      p.name,
      p.text,
      JSON_BUILD_OBJECT(
        'ORIGINAL', COUNT(*) FILTER (WHERE q.origin = 'ORIGINAL'),
        'EXTERNAL', COUNT(*) FILTER (WHERE q.origin = 'EXTERNAL')
      ) AS "availableByType"
    FROM "Path" p
    LEFT JOIN "Question" q ON q.path_id = p.id
    WHERE p.subject_id = ${id}
    AND q.exam_id is NULL
    GROUP BY p.id, p.name, p.text
  `;

  return result;
}
}