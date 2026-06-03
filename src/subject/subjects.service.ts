import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubjectRepository } from './subjects.repository';
import { SubjectListingResponseDto } from './dto/subjectListing.dto.';
import { AllSubjectsPathsResponseDto } from './dto/allPathsBySubject.dto';
import { CountByPathAndTypeDto } from './dto/countByPathAndType.dto';

@Injectable()
export class SubjectService {
  constructor(private subjectRepository: SubjectRepository) { }

  async findAllWithAnsweredByUser(userId: string): Promise<SubjectListingResponseDto> {
    const data = await this.subjectRepository.findAllWithAnsweredByUser(userId);

    return {
      data: data.map((item) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        totalQuestions: item.totalQuestions,
        answeredQuestions: item.answeredQuestions,
      })),
    };
  }

  async findAllPathsBySubject(id: string, userId: string): Promise<AllSubjectsPathsResponseDto> {
    const subjectExists = await this.subjectRepository.existsSubjectById(id);

    if (!subjectExists) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    const result = await this.subjectRepository.findAllPathsBySubject(id, userId);

    return {
      data: result.map((item) => ({
        id: item.id,
        name: item.name,
        text: item.text,
        icon: item.icon,
        availableByType: {
          ORIGINAL: Number(item.availableByType?.ORIGINAL ?? 0),
          EXTERNAL: Number(item.availableByType?.EXTERNAL ?? 0),
        },
        answeredByType: {
          ORIGINAL: Number(item.answeredByType?.ORIGINAL ?? 0),
          EXTERNAL: Number(item.answeredByType?.EXTERNAL ?? 0),
        },
      })),
    };
  }

  async countByPathAndType(
    pathId: string,
    type: 'ORIGINAL' | 'EXTERNAL' | undefined,
    userId: string,
  ): Promise<CountByPathAndTypeDto> {


    const pathExists = await this.subjectRepository.existsPathById(pathId);

    if (!pathExists) {
      throw new NotFoundException('Tópico não encontrado');
    }

    const result: CountByPathAndTypeDto =
      await this.subjectRepository.countByPathAndType(
        pathId,
        userId,
        type
      );

    return result;
  }
}
