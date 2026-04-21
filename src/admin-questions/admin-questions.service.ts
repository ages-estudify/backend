import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Language, Origin, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { AdminQuestionsRepository } from './admin-questions.repository';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';

const VALID_LETTERS = ['A', 'B', 'C', 'D', 'E'];

@Injectable()
export class AdminQuestionsService {
  constructor(private readonly repository: AdminQuestionsRepository) {}

  async create(dto: CreateQuestionDto) {
    await this.validateRelations(dto.path_id, dto.exam_id);
    this.validateAlternatives(dto.alternatives);

    return await this.repository.create(
      {
        text: dto.text,
        feedback: dto.feedback,
        image: dto.image ?? null,
        number: dto.number ?? null,
        year: dto.year,
        day: dto.day ?? null,
        language: dto.language ?? null,
        origin: dto.origin,
        path_id: dto.path_id,
        exam_id: dto.exam_id ?? null,
      },
      dto.alternatives.map((alt) => ({
        letter: alt.letter,
        text: alt.text,
        is_correct: alt.is_correct,
      })),
    );
  }

  async findAll(query: QueryQuestionsDto) {
    const page = query.page ?? 0;
    const size = query.size ?? 20;

    const where: Prisma.QuestionWhereInput = { enable: true };
    if (query.path_id) where.path_id = query.path_id;
    if (query.exam_id) where.exam_id = query.exam_id;
    if (query.origin) where.origin = query.origin;
    if (query.year) where.year = query.year;

    const { content, totalElements } = await this.repository.findMany(where, page * size, size);

    return { content, page, size, totalElements };
  }

  async findOne(id: string) {
    const question = await this.repository.findById(id);
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);

    if (dto.path_id) {
      const pathExists = await this.repository.pathExists(dto.path_id);
      if (!pathExists) throw new BadRequestException('Path not found');
    }
    if (dto.exam_id) {
      const examExists = await this.repository.examExists(dto.exam_id);
      if (!examExists) throw new BadRequestException('Exam not found');
    }

    const updateData: Prisma.QuestionUpdateInput = {};
    if (dto.text !== undefined) updateData.text = dto.text;
    if (dto.feedback !== undefined) updateData.feedback = dto.feedback;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.number !== undefined) updateData.number = dto.number;
    if (dto.year !== undefined) updateData.year = dto.year;
    if (dto.day !== undefined) updateData.day = dto.day;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.origin !== undefined) updateData.origin = dto.origin;
    if (dto.enable !== undefined) updateData.enable = dto.enable;
    if (dto.path_id) updateData.path = { connect: { id: dto.path_id } };
    if (dto.exam_id) updateData.exam = { connect: { id: dto.exam_id } };

    if (dto.alternatives) {
      this.validateAlternatives(dto.alternatives);
      await this.repository.deleteAlternatives(id);
      for (const alt of dto.alternatives) {
        await this.repository.createAlternative({
          letter: alt.letter,
          text: alt.text,
          is_correct: alt.is_correct,
          question: { connect: { id } },
        });
      }
    }

    return this.repository.update(id, updateData);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repository.update(id, { enable: false });
  }

  async importCsv(buffer: Buffer) {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    }); // <-- Adicione este "as"

    const results: { row: number; success: boolean; error?: string; id?: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i] as Record<string, string>;
      try {
        this.validateCsvRow(row, i + 2);

        const pathExists = await this.repository.pathExists(row['path_id']);
        if (!pathExists) throw new Error(`Path '${row['path_id']}' not found`);

        if (row['exam_id']) {
          const examExists = await this.repository.examExists(row['exam_id']);
          if (!examExists) throw new Error(`Exam '${row['exam_id']}' not found`);
        }

        const correctAnswer = row['correct_answer'].toUpperCase();

        const question = await this.repository.create(
          {
            text: row['text'],
            feedback: row['feedback'],
            image: null,
            number: row['number'] ? parseInt(row['number'], 10) : null,
            year: parseInt(row['year'], 10),
            day: row['day'] ? parseInt(row['day'], 10) : null,
            language: row['language'] ? (row['language'] as Language) : null,
            origin: row['origin'] as Origin,
            path_id: row['path_id'],
            exam_id: row['exam_id'] || null,
          },
          VALID_LETTERS.map((letter) => ({
            letter,
            text: row[`alternative_${letter.toLowerCase()}`],
            is_correct: letter === correctAnswer,
          })),
        );

        results.push({ row: i + 2, success: true, id: question!.id });
      } catch (err) {
        results.push({
          row: i + 2,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return { total: records.length, successCount, errorCount, results };
  }

  private validateCsvRow(row: Record<string, string>, rowNumber: number) {
    const required = [
      'path_id',
      'text',
      'feedback',
      'year',
      'origin',
      'alternative_a',
      'alternative_b',
      'alternative_c',
      'alternative_d',
      'alternative_e',
      'correct_answer',
    ];

    for (const col of required) {
      if (!row[col]?.trim()) {
        throw new Error(`Row ${rowNumber}: missing required column '${col}'`);
      }
    }

    const correctAnswer = row['correct_answer'].toUpperCase();
    if (!VALID_LETTERS.includes(correctAnswer)) {
      throw new Error(
        `Row ${rowNumber}: correct_answer must be A-E, got '${row['correct_answer']}'`,
      );
    }

    const origin = row['origin'].toUpperCase();
    if (!['ORIGINAL', 'EXTERNAL'].includes(origin)) {
      throw new Error(
        `Row ${rowNumber}: origin must be ORIGINAL or EXTERNAL, got '${row['origin']}'`,
      );
    }

    if (row['language']?.trim()) {
      const lang = row['language'].toUpperCase();
      if (!['ENGLISH', 'SPANISH'].includes(lang)) {
        throw new Error(
          `Row ${rowNumber}: language must be ENGLISH or SPANISH, got '${row['language']}'`,
        );
      }
    }

    const year = parseInt(row['year'], 10);
    if (isNaN(year)) {
      throw new Error(`Row ${rowNumber}: year must be a number`);
    }
  }

  async findAllPaths() {
    return this.repository.findAllPaths();
  }

  async findAllExams() {
    return this.repository.findAllExams();
  }

  private async validateRelations(pathId: string, examId?: string) {
    const pathExists = await this.repository.pathExists(pathId);
    if (!pathExists) throw new BadRequestException('Path not found');

    if (examId) {
      const examExists = await this.repository.examExists(examId);
      if (!examExists) throw new BadRequestException('Exam not found');
    }
  }

  private validateAlternatives(alternatives: { letter: string; is_correct: boolean }[]) {
    const letters = alternatives.map((a) => a.letter.toUpperCase()).sort();
    if (letters.join('') !== 'ABCDE') {
      throw new BadRequestException('Alternatives must have exactly letters A, B, C, D, E');
    }

    const correctCount = alternatives.filter((a) => a.is_correct).length;
    if (correctCount !== 1) {
      throw new BadRequestException('Exactly one alternative must be marked as correct');
    }
  }
}
