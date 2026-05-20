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
import { ExamMapper } from './mapper/exam.mapper';
import { ExamListingWithAttemptsByUserDto } from './dto/examListingWithAttemptsByUser.dto';
import { ResultGridItemDto, ResultGridItemStatus } from './dto/result-grid-item.dto';
import { ResultGridQueryDto } from './dto/result-grid-query.dto';
import { ResultGridSuccessResponseDto } from './dto/result-grid-response.dto';
import { Role } from '@prisma/client';

interface ParsedRow {
  exam_title: string;
  bank: string;
  exam_day: string;
  discipline: string;
  content: string;
  question: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  alternative_e: string;
  correct_answer: string;
  answer_explanation: string;
  year: string;
}

type AnswerWithRelations = {
  answer_date: Date;
  question_id: string;
  alternative_id: string | null;
  question: {
    number: number | null;
    alternatives: {
      letter: string;
      is_correct: boolean;
    }[];
  };
  alternative: {
    letter: string;
  } | null;
};

@Injectable()
export class ExamsService {
  private readonly maxFileSize = 10 * 1024 * 1024;
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

  async listAllExams(userRole: Role): Promise<ListExamsResponseDto> {
    const exams = await this.examsRepository.findAllExamsByRole(userRole);

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

    const { validRows, errors } = CsvUtils.validateStructure(parsedRows, this.requiredColumns);

    if (errors.length > 0) {
      throw new BadRequestException('CSV format invalid', JSON.stringify(errors));
    }

    const metadata = CsvUtils.validateMetadata(validRows);

    if (metadata.error) {
      throw new BadRequestException(metadata.error);
    }

    if (validRows.length > this.maxQuestions) {
      throw new BadRequestException('CSV exceeds questions limit');
    }

    const enrichedAndValidated = await this.validateAndEnrichRows(validRows);

    const result = await this.prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          name: metadata.examTitle!,
          origin: metadata.bank!,
          image_url: null,
          status: 'DRAFT',
        },
      });

      const uniqueDays = [...new Set(enrichedAndValidated.validRows.map((r) => r.parsed.exam_day))];

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
        const examDayId = createdDays.get(enriched.parsed.exam_day);

        if (!examDayId) {
          throw new Error(`Exam day not found for ${enriched.parsed.exam_day}`);
        }

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

        const correctAnswer = enriched.parsed.correct_answer.toUpperCase();

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
      throw new BadRequestException('Invalid status');
    }

    const updateData: Partial<{
      name: string;
      origin: string;
      image_url: string | null;
      status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    }> = {};

    if (updates.title) updateData.name = updates.title;
    if (updates.origin) updateData.origin = updates.origin;

    if (updates.image) {
      const imageUrl = this.uploadImageToS3(updates.image, id);
      updateData.image_url = imageUrl;
      updateData.status = updates.status ?? 'PUBLISHED';
    } else if (updates.status) {
      updateData.status = updates.status;
    }

    if (updateData.status === 'PUBLISHED' && !updateData.image_url && !exam.image_url) {
      throw new BadRequestException('Cannot publish exam without image');
    }

    const updated = await this.examsRepository.updateExam(id, updateData);

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

  async findAllWithLastAttemptByUser(
    userRole: Role,
    userId: string,
  ): Promise<ExamListingWithAttemptsByUserDto> {
    const exams = await this.examsRepository.findAllExamsByRole(userRole);
    const attempts = await this.examsRepository.findAllAttemptsByUser(userId);

    const attemptByExamId = new Map(attempts.map((a) => [a.exam_id, a]));

    const result = exams.map((exam) => {
      const attempt = attemptByExamId.get(exam.id);

      return {
        ...exam,
        hasAttempt: !!attempt,
        isCompleted: attempt?.isCompleted ?? false,
        totalAnswers: attempt?.totalAnswers ?? 0,
        attempt_days: attempt?.attempt_days ?? [],
      };
    });

    const response = ExamMapper.toResponse(result);

    const sorted = {
      ...response,
      data: response.data.sort((a, b) => {
        const order = {
          in_progress: 1,
          available: 2,
          completed: 3,
        };

        return order[a.status] - order[b.status];
      }),
    };

    return sorted;
  }

  async getResultGrid(
    attemptId: string,
    userId: string,
    query?: ResultGridQueryDto,
  ): Promise<ResultGridSuccessResponseDto> {
    const attempt = await this.getAttempt(attemptId, userId);

    const filteredAttemptDays = query?.attemptDayId
      ? (attempt.attempt_days as any[]).filter((ad) => ad.id === query.attemptDayId)
      : (attempt.attempt_days as any[]);

    const answerByQuestionId = new Map<string, AnswerWithRelations>();
    for (const ad of filteredAttemptDays) {
      for (const ans of ad.answers ?? []) {
        answerByQuestionId.set(ans.question_id, ans as AnswerWithRelations);
      }
    }

    const allQuestions: Array<{
      examDayDay: number;
      question: {
        id: string;
        number: number | null;
        alternatives: { letter: string; is_correct: boolean }[];
      };
      answer?: AnswerWithRelations;
    }> = [];

    for (const ad of filteredAttemptDays) {
      const dayNum = ad.exam_day.day;
      for (const q of ad.exam_day.questions ?? []) {
        allQuestions.push({
          examDayDay: dayNum,
          question: q,
          answer: answerByQuestionId.get(q.id),
        });
      }
    }

    allQuestions.sort((a, b) => {
      if (a.examDayDay !== b.examDayDay) return a.examDayDay - b.examDayDay;
      const an = a.question.number ?? Number.MAX_SAFE_INTEGER;
      const bn = b.question.number ?? Number.MAX_SAFE_INTEGER;
      if (an !== bn) return an - bn;
      return a.question.id.localeCompare(b.question.id);
    });

    const gridWithoutFilter = allQuestions.map((item, index) => ({
      questionId: item.question.id,
      number: index + 1,
      status: this.getQuestionStatus(item.answer, item.question.alternatives),
    }));

    const grid = this.filterGridByStatus(gridWithoutFilter, query?.statusFilter);

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        totalQuestions: gridWithoutFilter.length,
        grid,
      },
    };
  }

  private async getAttempt(attemptId: string, userId: string) {
    const attempt = await this.examsRepository.findAttemptResultGridById(attemptId, userId);

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return attempt;
  }

  private filterGridByStatus(
    grid: ResultGridItemDto[],
    statusFilter?: ResultGridItemStatus[],
  ): ResultGridItemDto[] {
    if (!statusFilter?.length) {
      return grid;
    }

    return grid.filter((item) => statusFilter.includes(item.status));
  }

  private getQuestionStatus(
    answer: AnswerWithRelations | undefined,
    alternatives: { letter: string; is_correct: boolean }[],
  ): ResultGridItemStatus {
    if (!answer || !answer.alternative) {
      return 'BLANK';
    }

    const correctAlternative = alternatives.find((alternative) => alternative.is_correct);

    if (answer.alternative.letter === correctAlternative?.letter) {
      return 'CORRECT';
    }

    return 'WRONG';
  }

  private async validateAndEnrichRows(rows: ValidatedRow[]) {
    const validRows: {
      parsed: ParsedRow;
      pathId: string;
    }[] = [];

    const invalidRows: ValidatedRow[] = [];

    for (const row of rows) {
      const pathId = await this.examsRepository.pathByNameAndSubject(row.content!, row.discipline!);

      if (!pathId) {
        invalidRows.push({
          ...row,
          error: `Path not found for discipline '${row.discipline}' and content '${row.content}'`,
        });
        continue;
      }

      validRows.push({
        parsed: CsvUtils.parseRow(row) as ParsedRow,
        pathId,
      });
    }

    return { validRows, invalidRows };
  }

  private uploadImageToS3(file: MulterFile, examId: string): string {
    return `https://s3.amazonaws.com/bucket/exam-${examId}.png`;
  }
}
