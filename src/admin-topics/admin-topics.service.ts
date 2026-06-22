import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Path, Prisma } from '@prisma/client';
import { IconMediaService } from '../storage/icon-media.service';
import { AdminTopicsRepository } from './admin-topics.repository';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class AdminTopicsService {
  constructor(
    private readonly repository: AdminTopicsRepository,
    private readonly iconMedia: IconMediaService,
  ) {}

  async findAll(enable: boolean = true, subjectId?: string) {
    const paths = await this.repository.findMany(enable, subjectId);
    const iconUrls = await this.iconMedia.resolveIconUrls(paths.map((p) => p.icon_key));
    return {
      data: paths.map((path, index) => this.toTopicResponse(path, iconUrls[index])),
    };
  }

  async create(dto: CreateTopicDto) {
    await this.ensureSubjectExists(dto.subjectId);

    const maxSchedule = await this.repository.getMaxSchedulePosition();
    const schedulePosition = (maxSchedule ?? 0) + 1;

    let created: Path;
    try {
      created = await this.repository.create({
        name: dto.name,
        text: dto.text ?? '',
        icon_key: '',
        trail_position: dto.order,
        schedule_position: schedulePosition,
        subject: { connect: { id: dto.subjectId } },
      });
    } catch (error) {
      throw this.mapWriteError(error);
    }

    if (dto.icon) {
      const iconKey = await this.iconMedia.uploadPathIconFromBase64(created.id, dto.icon);
      await this.repository.update(created.id, { icon_key: iconKey });
    }

    return { id: created.id, message: 'Topic created successfully' };
  }

  async update(id: string, dto: UpdateTopicDto) {
    await this.findOne(id);

    if (dto.subjectId !== undefined) {
      await this.ensureSubjectExists(dto.subjectId);
    }

    const data: Prisma.PathUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.text !== undefined) data.text = dto.text;
    if (dto.icon !== undefined) {
      data.icon_key = dto.icon ? await this.iconMedia.uploadPathIconFromBase64(id, dto.icon) : '';
    }
    if (dto.order !== undefined) data.trail_position = dto.order;
    if (dto.enable !== undefined) data.enable = dto.enable;
    if (dto.subjectId !== undefined) data.subject = { connect: { id: dto.subjectId } };

    try {
      await this.repository.update(id, data);
      return { message: 'Topic updated successfully' };
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repository.softDelete(id);
    return { message: 'Topic deleted successfully' };
  }

  private async findOne(id: string): Promise<Path> {
    const path = await this.repository.findById(id);
    if (!path) {
      throw new NotFoundException('Topic not found');
    }
    return path;
  }

  private async ensureSubjectExists(subjectId: string): Promise<void> {
    if (!(await this.repository.subjectExists(subjectId))) {
      throw new BadRequestException('Subject not found');
    }
  }

  private toTopicResponse(path: Path, iconUrl: string | null) {
    return {
      id: path.id,
      name: path.name,
      text: path.text,
      iconUrl,
      order: path.trail_position,
      subjectId: path.subject_id,
    };
  }

  private mapWriteError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException('A topic with this order already exists for this subject');
    }
    return error instanceof Error ? error : new Error('Unexpected error');
  }
}
