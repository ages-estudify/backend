import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminTopicsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(subjectId?: string) {
    return this.prisma.path.findMany({
      where: { enable: true, ...(subjectId ? { subject_id: subjectId } : {}) },
      orderBy: [{ subject_id: 'asc' }, { trail_position: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.path.findUnique({ where: { id } });
  }

  async create(data: Prisma.PathCreateInput) {
    return this.prisma.path.create({ data });
  }

  async update(id: string, data: Prisma.PathUpdateInput) {
    return this.prisma.path.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.path.update({ where: { id }, data: { enable: false } });
  }

  async subjectExists(id: string): Promise<boolean> {
    const count = await this.prisma.subject.count({ where: { id } });
    return count > 0;
  }

  async getMaxSchedulePosition(): Promise<number | null> {
    const result = await this.prisma.path.aggregate({ _max: { schedule_position: true } });
    return result._max.schedule_position ?? null;
  }
}
