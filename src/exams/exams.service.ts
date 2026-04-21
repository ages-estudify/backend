import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ExamsRepository } from './exams.repository';
import { PrismaService } from '../prisma.service';
import { ListExamsResponseDto, ListExamItemDto, ExamDayDto } from './dto';

interface CsvRow {
  exam_title?: string;
  bank?: string;
  exam_day?: string;
  discipline?: string;
  content?: string;
  question?: string;
  alternative_a?: string;
  alternative_b?: string;
  alternative_c?: string;
  alternative_d?: string;
  alternative_e?: string;
  correct_answer?: string;
  answer_explanation?: string;
  year?: string;
  [key: string]: string | undefined;
}

interface ValidatedRow extends CsvRow {
  lineNumber: number;
  error?: string;
}

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

  async importExamFromCsv(
    file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    data: {
      examId: string;
      status: string;
      daysCreated: number;
      importedQuestions: number;
      failed: number;
      errors: Array<{ line: number; error: string }>;
    };
  }> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(\File size exceeds \ MB limit\);
    }

    // Parse CSV
    const parsedRows = this.parseCsv(file.buffer.toString('utf-8'));
    const validatedRows = this.validateCsvStructure(parsedRows);

    if (validatedRows.errors.length > 0) {
      throw new BadRequestException('CSV format invalid', JSON.stringify(validatedRows.errors));
    }

    // Validate metadata consistency (exam_title and bank must be same across all rows)
    const metadataValidation = this.validateMetadata(validatedRows.validRows);
    if (metadataValidation.error) {
      throw new BadRequestException(metadataValidation.error);
    }

    // Validate question count
    if (validatedRows.validRows.length > this.maxQuestions) {
      throw new BadRequestException(\CSV exceeds \ questions limit\);
    }

    // Enrich rows with lookups and validation
    const enrichedAndValidated = await this.validateAndEnrichRows(validatedRows.validRows);

    // Create transaction
    const result = await this.prisma.\(async (tx) => {
      // Create Exam
      const exam = await tx.exam.create({
        data: {
          name: metadataValidation.examTitle!,
          origin: metadataValidation.bank!,
          image_url: null,
          status: 'DRAFT',
        },
      });

      // Create ExamDays and group questions
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

      // Create Questions and Alternatives
      let importedCount = 0;

      for (const enriched of enrichedAndValidated.validRows) {
        const examDayId = createdDays.get(enriched.parsed.exam_day)!;

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

        // Create alternatives
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
      image?: Express.Multer.File;
      status?: 'DRAFT' | 'PUBLISHED';
    },
  ) {
    const exam = await this.examsRepository.findExamById(id);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Validate status
    if (updates.status && !['DRAFT', 'PUBLISHED'].includes(updates.status)) {
      throw new BadRequestException('Invalid status. Only DRAFT or PUBLISHED allowed');
    }

    const updateData: any = {};

    if (updates.title) {
      updateData.name = updates.title;
    }

    if (updates.origin) {
      updateData.origin = updates.origin;
    }

    // Handle image upload and auto-transition
    if (updates.image) {
      // TODO: Implement S3 upload
      const imageUrl = await this.uploadImageToS3(updates.image, id);
      updateData.image_url = imageUrl;

      // Auto-transition: if no explicit status provided and image uploaded, go to PUBLISHED
      if (!updates.status) {
        updateData.status = 'PUBLISHED';
      } else {
        updateData.status = updates.status;
      }
    } else if (updates.status) {
      updateData.status = updates.status;
    }

    // Validate: can't publish without image
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

  // Private helper methods

  private parseCsv(csvContent: string): ValidatedRow[] {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have header and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: ValidatedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: ValidatedRow = { lineNumber: i + 1 };

      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j];
      }

      rows.push(row);
    }

    return rows;
  }

  private validateCsvStructure(rows: ValidatedRow[]): {
    validRows: ValidatedRow[];
    errors: Array<{ line: number; error: string }>;
  } {
    const errors: Array<{ line: number; error: string }> = [];
    const validRows: ValidatedRow[] = [];

    // Check headers
    if (!rows.length) {
      errors.push({ line: 1, error: 'CSV is empty' });
      return { validRows, errors };
    }

    const firstRow = rows[0];
    for (const col of this.requiredColumns) {
      if (!(col in firstRow)) {
        errors.push({ line: 1, error: \Missing required column: \\ });
      }
    }

    if (errors.length > 0) {
      return { validRows, errors };
    }

    // Validate each row
    for (const row of rows) {
      const rowErrors: string[] = [];

      if (!row.exam_day || !/^\d+\$/.test(row.exam_day)) {
        rowErrors.push('exam_day must be a positive integer');
      }

      if (!['A', 'B', 'C', 'D', 'E'].includes((row.correct_answer || '').toUpperCase())) {
        rowErrors.push('Correct answer must be A-E');
      }

      if (!row.question) {
        rowErrors.push('Question text is required');
      }

      if (!row.alternative_a || !row.alternative_b || !row.alternative_c || !row.alternative_d || !row.alternative_e) {
        rowErrors.push('All alternatives (A-E) are required');
      }

      if (!row.discipline) {
        rowErrors.push('Discipline is required');
      }

      if (!row.content) {
        rowErrors.push('Content is required');
      }

      if (!row.year) {
        rowErrors.push('Year is required');
      }

      if (rowErrors.length > 0) {
        errors.push({ line: row.lineNumber, error: rowErrors.join('; ') });
      } else {
        validRows.push(row);
      }
    }

    return { validRows, errors };
  }

  private validateMetadata(rows: ValidatedRow[]): {
    error?: string;
    examTitle?: string;
    bank?: string;
  } {
    if (rows.length === 0) {
      return { error: 'No valid rows in CSV' };
    }

    const firstExamTitle = rows[0].exam_title;
    const firstBank = rows[0].bank;

    for (const row of rows) {
      if (row.exam_title !== firstExamTitle) {
        return { error: 'exam_title must be consistent across all rows' };
      }
      if (row.bank !== firstBank) {
        return { error: 'bank must be consistent across all rows' };
      }
    }

    return { examTitle: firstExamTitle, bank: firstBank };
  }

  private async validateAndEnrichRows(
    rows: ValidatedRow[],
  ): Promise<{
    validRows: Array<ValidatedRow & { pathId: string; parsed: any }>;
    invalidRows: ValidatedRow[];
  }> {
    const validRows: Array<ValidatedRow & { pathId: string; parsed: any }> = [];
    const invalidRows: ValidatedRow[] = [];

    for (const row of rows) {
      const errors: string[] = [];

      // Lookup path by discipline and content
      const pathId = await this.examsRepository.pathByNameAndSubject(row.content!, row.discipline!);

      if (!pathId) {
        errors.push(\Path not found for discipline '\' and content '\'\);
      }

      if (errors.length > 0) {
        invalidRows.push({ ...row, error: errors.join('; ') });
      } else {
        validRows.push({
          ...row,
          pathId: pathId!,
          parsed: {
            exam_day: row.exam_day,
            question: row.question,
            alternative_a: row.alternative_a,
            alternative_b: row.alternative_b,
            alternative_c: row.alternative_c,
            alternative_d: row.alternative_d,
            alternative_e: row.alternative_e,
            correct_answer: row.correct_answer,
            answer_explanation: row.answer_explanation,
            year: row.year,
          },
        });
      }
    }

    return { validRows, invalidRows };
  }

  private async uploadImageToS3(file: Express.Multer.File, examId: string): Promise<string> {
    // TODO: Implement S3 upload
    // For now, return placeholder URL
    return \https://s3.amazonaws.com/bucket/exam-\-\.png\;
  }
}
