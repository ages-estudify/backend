import {
  Injectable,
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ExamsRepository } from './exams.repository';
import { PrismaService } from '../prisma.service';
import { ListExamsResponseDto, ListExamItemDto } from './dto';
import { MulterFile } from '../common/types/multer-file';
import { CsvUtils, ValidatedRow } from './utils/csv.utils';

@Injectable()
export class ExamsService {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10 MB
  private readonly maxQuestions = 180;

  private readonly requiredColumns = [
    'exam_title',
    'bank',
    'exam_day',
    'discipline',
    'content',
    'question',
    'alternative_a',
    'alternative_b',
    'alternative_c',
    'alternative_d',
    'alternative_e',
    'correct_answer',
    'answer_explanation',
    'year',
  ];

  constructor(
    private examsRepository: ExamsRepository,
    private prisma: PrismaService,
  ) {}

  async listAllExams(): Promise<ListExamsResponseDto> {
    const exams = await this.examsRepository.findAllExams();

    const data: ListExamItemDto[] = await Promise.all(
      exams.map(async (exam) => ({
        id: exam.id,
        title: exam.name,
        origin: exam.origin,
        imageUrl: exam.image_url,
        totalQuestions: await this.examsRepository.countQuestionsByExam(exam.id),
        status: exam.status,
        days: exam.exam_days.map((day) => ({
          day: day.day,
          totalQuestions: day.questions.length,
        })),
      })),
    );

    return { data };
  }

  async importExamFromCsv(file: MulterFile) {
    if (file.size > this.maxFileSize) {
      throw new PayloadTooLargeException('File size exceeds limit');
    }

    const parsedRows = CsvUtils.parseCsv(file.buffer.toString('utf-8'));

    const { validRows, errors } = CsvUtils.validateStructure(
      parsedRows,
      this.requiredColumns,
    );

    if (errors.length > 0) {
      throw new BadRequestException(
        'CSV format invalid',
        JSON.stringify(errors),
      );
    }

    const metadata = CsvUtils.validateMetadata(validRows);

    if (metadata.error) {
      throw new BadRequestException(metadata.error);
    }

    if (validRows.length > this.maxQuestions) {
      throw new BadRequestException('CSV exceeds questions limit');
    }

    const enrichedAndValidated =
      await this.validateAndEnrichRows(validRows);

    const result = await this.prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          name: metadata.examTitle!,
          origin: metadata.bank!,
          image_url: null,
          status: 'DRAFT',
        },
      });

      const uniqueDays = [
        ...new Set(
          enrichedAndValidated.validRows.map((r) => r.parsed.exam_day),
        ),
      ];

      const createdDays = new Map<string, string>();

      for (const day of uniqueDays) {
        const examDay = await tx.examDay.create({
          data: {
            day: parseInt(day, 10),
            exam_id: exam.id,
          },
        });

        createdDays.set(day, examDay.id);
      }

      let importedCount = 0;

      for (const enriched of enrichedAndValidated.validRows) {
        const examDayId = createdDays.get(
          enriched.parsed.exam_day,
        )!;

        const question = await tx.question.create({
          data: {
            text: enriched.parsed.question,
            origin: 'ORIGINAL',
            year: parseInt(enriched.parsed.year, 10),
            feedback: enriched.parsed.answer_explanation,
            path_id: enriched.pathId,
            exam_day_id: examDayId,
          },
        });

        const correctAnswer =
          enriched.parsed.correct_answer.toUpperCase();

        const alternatives = [
          { letter: 'A', text: enriched.parsed.alternative_a },
          { letter: 'B', text: enriched.parsed.alternative_b },
          { letter: 'C', text: enriched.parsed.alternative_c },
          { letter: 'D', text: enriched.parsed.alternative_d },
          { letter: 'E', text: enriched.parsed.alternative_e },
        ];

        for (const alt of alternatives) {
          await tx.alternative.create({
            data: {
              letter: alt.letter,
              text: alt.text,
              is_correct: alt.letter === correctAnswer,
              question_id: question.id,
            },
          });
        }

        importedCount++;
      }

      return {
        examId: exam.id,
        status: 'DRAFT',
        daysCreated: uniqueDays.length,
        importedQuestions: importedCount,
        failed: enrichedAndValidated.invalidRows.length,
        errors: enrichedAndValidated.invalidRows.map((r) => ({
          line: r.lineNumber,
          error: r.error || 'Unknown error',
        })),
      };
    });

    return { success: true, data: result };
  }

  async updateExam(
    id: string,
    updates: {
      title?: string;
      origin?: string;
      image?: MulterFile;
      status?: 'DRAFT' | 'PUBLISHED';
    },
  ) {
    const exam = await this.examsRepository.findExamById(id);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (updates.status && !['DRAFT', 'PUBLISHED'].includes(updates.status)) {
      throw new BadRequestException(
        'Invalid status. Only DRAFT or PUBLISHED allowed',
      );
    }

    const updateData: any = {};

    if (updates.title) updateData.name = updates.title;
    if (updates.origin) updateData.origin = updates.origin;

    if (updates.image) {
      const imageUrl = await this.uploadImageToS3(updates.image, id);
      updateData.image_url = imageUrl;
      updateData.status = updates.status ?? 'PUBLISHED';
    } else if (updates.status) {
      updateData.status = updates.status;
    }

    if (
      updateData.status === 'PUBLISHED' &&
      !updateData.image_url &&
      !exam.image_url
    ) {
      throw new BadRequestException(
        'Cannot publish exam without image',
      );
    }

    const updated = await this.examsRepository.updateExam(
      id,
      updateData,
    );

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.name,
        origin: updated.origin,
        imageUrl: updated.image_url,
        status: updated.status,
      },
    };
  }

  async deleteExamLogical(id: string) {
    const exam = await this.examsRepository.findExamById(id);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    await this.examsRepository.deleteExamLogical(id);
  }

  private async validateAndEnrichRows(rows: ValidatedRow[]) {
    const validRows: any[] = [];
    const invalidRows: ValidatedRow[] = [];

    for (const row of rows) {
      const pathId =
        await this.examsRepository.pathByNameAndSubject(
          row.content!,
          row.discipline!,
        );

      if (!pathId) {
        invalidRows.push({
          ...row,
          error: `Path not found for discipline '${row.discipline}' and content '${row.content}'`,
        });
        continue;
      }

      validRows.push({
        ...row,
        pathId,
        parsed: CsvUtils.parseRow(row),
      });
    }

    return { validRows, invalidRows };
  }

  private async uploadImageToS3(
    file: MulterFile,
    examId: string,
  ): Promise<string> {
    return `https://s3.amazonaws.com/bucket/exam-${examId}.png`;
  }
}