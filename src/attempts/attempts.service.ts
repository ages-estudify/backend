import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AttemptsService {

  constructor(private prisma: PrismaService){}
  
  async create(examId: string, userId: string, language: string) {
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        user_id: userId,
        exam_id: examId,
        end_time: null,
      }
    })

    if (existingAttempt) {
      return existingAttempt;
    }

    const attempt = await this.prisma.attempt.create({
      data:{
        user_id: userId,
        exam_id: examId,
        language: language as any,
        init_time: new Date(),
        current_question: 1,
        time_spent_minutes: 0,
      }
    })
    return attempt;
  }
}
