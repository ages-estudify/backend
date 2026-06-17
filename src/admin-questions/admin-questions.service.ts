import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Origin, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import {
  AdminQuestionsRepository,
  CreateQuestionPersistenceInput,
} from './admin-questions.repository';
import {
  AdminQuestionType,
  AlternativesObjectDto,
  CreateQuestionDto,
} from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { QuestionMediaService } from '../storage/question-media.service';
import { IconMediaService } from '../storage/icon-media.service';
import { decodeBase64Image } from '../storage/base64-image.util';

const VALID_LETTERS = ['A', 'B', 'C', 'D', 'E'];

@Injectable()
export class AdminQuestionsService {
  constructor(
    private readonly repository: AdminQuestionsRepository,
    private readonly questionMedia: QuestionMediaService,
    private readonly iconMedia: IconMediaService,
  ) {}

  async create(dto: CreateQuestionDto) {
    const letter = dto.correctAnswer.trim().toUpperCase();
    if (!VALID_LETTERS.includes(letter)) {
      throw new BadRequestException('correctAnswer must be A, B, C, D or E');
    }

    const alternatives = this.alternativesObjectToPersistence(dto.alternatives, letter);
    this.validateAlternativesArray(alternatives);

    const pathId = await this.resolvePathId(dto.pathId);
    await this.validateExam(dto.mockExamId);

    const persistence: CreateQuestionPersistenceInput = {
      discipline: dto.discipline,
      content: dto.content,
      bank: dto.bank ?? null,
      text: dto.question,
      feedback: dto.answerExplanation,
      year: dto.year,
      origin: this.adminTypeToOrigin(dto.type),
      path_id: pathId,
      exam_id: dto.mockExamId ?? null,
      number: dto.number ?? null,
      alternatives,
    };

    const created = await this.repository.create(persistence);
    if (!created) {
      throw new BadRequestException('Failed to create question');
    }

    if (dto.image?.trim()) {
      return this.saveQuestionImageFromBase64(created.id, dto.image);
    }

    return await this.toAdminResponse(created);
  }

  async findAll(query: QueryQuestionsDto, enable?: boolean) {
    const page = query.page ?? 0;
    const size = query.size ?? 20;

    const where: Prisma.QuestionWhereInput = {};
    if (query.discipline) {
      where.discipline = { contains: query.discipline, mode: 'insensitive' };
    }
    if (query.content) {
      where.content = { contains: query.content, mode: 'insensitive' };
    }
    if (query.bank) {
      where.bank = { equals: query.bank, mode: 'insensitive' };
    }
    if (query.year !== undefined) {
      where.year = query.year;
    }
    if (query.mockExamId) {
      where.exam_id = query.mockExamId;
    }
    if (enable !== undefined) {
      where.enable = enable;
    }

    const { content, totalElements } = await this.repository.findMany(where, page * size, size);

    return {
      content: await Promise.all(content.map((q) => this.toAdminResponse(q))),
      page,
      size,
      totalElements,
    };
  }

  async findOne(id: string) {
    const question = await this.repository.findById(id);
    if (!question) throw new NotFoundException('Question not found');
    return await this.toAdminResponse(question);
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOneRaw(id);

    if (dto.pathId) {
      const pathExists = await this.repository.pathExists(dto.pathId);
      if (!pathExists) throw new BadRequestException('Path not found');
    }

    if (dto.mockExamId && dto.mockExamId.length > 0) {
      const examExists = await this.repository.examExists(dto.mockExamId);
      if (!examExists) throw new BadRequestException('Exam not found');
    }

    if (dto.alternatives != null && dto.correctAnswer == null) {
      throw new BadRequestException('correctAnswer is required when alternatives are provided');
    }

    const updateData = this.buildUpdateData(dto);

    if (dto.alternatives && dto.correctAnswer) {
      const letter = dto.correctAnswer.trim().toUpperCase();
      if (!VALID_LETTERS.includes(letter)) {
        throw new BadRequestException('correctAnswer must be A, B, C, D or E');
      }
      const alts = this.alternativesObjectToPersistence(dto.alternatives, letter);
      this.validateAlternativesArray(alts);
      await this.repository.deleteAlternatives(id);
      for (const alt of alts) {
        await this.repository.createAlternative({
          letter: alt.letter,
          text: alt.text,
          is_correct: alt.is_correct,
          question: { connect: { id: id } },
        });
      }
    }

    const updated = await this.repository.update(id, updateData);

    if (dto.image?.trim()) {
      return this.saveQuestionImageFromBase64(id, dto.image);
    }

    return await this.toAdminResponse(updated);
  }

  async remove(id: string) {
    await this.findOneRaw(id);
    await this.repository.update(id, { enable: false });
  }

  private async saveQuestionImageFromBase64(questionId: string, imageBase64: string) {
    const { buffer, mimeType } = decodeBase64Image(imageBase64);
    const mediaKey = await this.questionMedia.uploadQuestionImage(questionId, buffer, mimeType);
    const updated = await this.repository.update(questionId, { media_key: mediaKey });
    return await this.toAdminResponse(updated);
  }

  async importCsv(buffer: Buffer) {
    let records: Record<string, string>[];
    try {
      records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
      });
    } catch {
      throw new BadRequestException(
        'The file could not be read as CSV. Upload a UTF-8 file with comma-separated values and a header row.',
      );
    }

    if (!Array.isArray(records)) {
      throw new BadRequestException('Invalid CSV structure.');
    }

    const results: { row: number; success: boolean; error?: string; id?: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const row = this.normalizeCsvRecord(raw);
      try {
        this.validateCsvRow(row, i + 2);

        const discipline = row['discipline'] || row['subject'];
        const content = row['content'];

        let pathId: string | null | undefined = row['path_id']?.trim();
        if (pathId) {
          const exists = await this.repository.pathExists(pathId);
          if (!exists) throw new Error(`Tópico com ID '${pathId}' não encontrado.`);
        } else {
          pathId = await this.repository.pathByNameAndSubject(content, discipline);
          if (!pathId)
            throw new Error(`Tópico '${content}' na disciplina '${discipline}' não encontrado.`);
        }

        let examId: string | null | undefined = undefined;
        const examInput =
          row['mock_exam_id']?.trim() || row['exam_title']?.trim() || row['exam_name']?.trim();
        if (examInput) {
          const exam = await this.repository.findExamByIdOrName(examInput);
          if (!exam) throw new Error(`Simulado '${examInput}' não encontrado.`);
          examId = exam.id;
        }

        const persistence = this.csvRowToPersistence(row, pathId, examId);
        const question = await this.repository.create(persistence);
        if (!question) {
          throw new Error('Failed to create question');
        }

        results.push({ row: i + 2, success: true, id: question.id });
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

  async findAllPaths() {
    const paths = await this.repository.findAllPaths();
    const pathIconUrls = await this.iconMedia.resolveIconUrls(paths.map((p) => p.icon_key));

    return paths.map((path, index) => {
      const { icon_key, ...pathData } = path;
      return {
        ...pathData,
        icon_url: pathIconUrls[index] ?? icon_key,
      };
    });
  }

  async findAllExams() {
    return this.repository.findAllExams();
  }

  private adminTypeToOrigin(type: AdminQuestionType): Origin {
    return type === AdminQuestionType.SIMPLIFIED ? 'EXTERNAL' : 'ORIGINAL';
  }

  private originToAdminType(origin: Origin): 'SIMPLIFIED' | 'ORIGINAL' {
    return origin === 'EXTERNAL' ? 'SIMPLIFIED' : 'ORIGINAL';
  }

  private async toAdminResponse(
    q: NonNullable<Awaited<ReturnType<AdminQuestionsRepository['findById']>>>,
  ): Promise<Record<string, unknown>> {
    const byLetter = Object.fromEntries(
      q.alternatives.map((a) => [a.letter.toUpperCase(), a.text]),
    ) as Record<'A' | 'B' | 'C' | 'D' | 'E', string>;
    const correctAnswer = q.alternatives.find((a) => a.is_correct)?.letter.toUpperCase() ?? '';

    const imageUrl = await this.questionMedia.resolveSignedUrl(q.media_key);

    return {
      id: q.id,
      discipline: q.discipline,
      content: q.content,
      question: q.text,
      alternatives: {
        A: byLetter.A,
        B: byLetter.B,
        C: byLetter.C,
        D: byLetter.D,
        E: byLetter.E,
      },
      correctAnswer,
      answerExplanation: q.feedback,
      type: this.originToAdminType(q.origin),
      year: q.year,
      number: q.number,
      mockExamId: q.exam_id,
      bank: q.bank,
      imageUrl,
      enable: q.enable,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    };
  }

  private async findOneRaw(id: string) {
    const question = await this.repository.findById(id);
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  private buildUpdateData(dto: UpdateQuestionDto): Prisma.QuestionUpdateInput {
    const u: Prisma.QuestionUpdateInput = {};
    if (dto.discipline !== undefined) u.discipline = dto.discipline;
    if (dto.content !== undefined) u.content = dto.content;
    if (dto.bank !== undefined) u.bank = dto.bank;
    if (dto.question !== undefined) u.text = dto.question;
    if (dto.answerExplanation !== undefined) u.feedback = dto.answerExplanation;
    if (dto.year !== undefined) u.year = dto.year;
    if (dto.number !== undefined) u.number = dto.number;
    if (dto.type !== undefined) u.origin = this.adminTypeToOrigin(dto.type);
    if (dto.enable !== undefined) u.enable = dto.enable;
    if (dto.pathId) u.path = { connect: { id: dto.pathId } };

    if (dto.mockExamId === null) {
      u.exam = { disconnect: true };
    } else if (dto.mockExamId) {
      u.exam = { connect: { id: dto.mockExamId } };
    }

    return u;
  }

  private alternativesObjectToPersistence(
    alt: AlternativesObjectDto,
    correctLetter: string,
  ): { letter: string; text: string; is_correct: boolean }[] {
    return VALID_LETTERS.map((L) => ({
      letter: L,
      text: alt[L as keyof AlternativesObjectDto],
      is_correct: L === correctLetter,
    }));
  }

  private csvRowToPersistence(
    row: Record<string, string>,
    pathId: string,
    examId?: string | null,
  ): CreateQuestionPersistenceInput {
    const discipline = row['discipline'] || row['subject'] || '';
    const correctAnswer = row['correct_answer'].toUpperCase();
    const type = this.parseAdminType(row['type']);

    return {
      discipline,
      content: row['content'],
      bank: row['bank']?.trim() || null,
      text: row['question'],
      feedback: row['answer_explanation'],
      year: parseInt(row['year'], 10),
      origin: this.adminTypeToOrigin(type),
      path_id: pathId,
      exam_id: examId ?? null,
      number: row['number']?.trim() ? parseInt(row['number'], 10) : null,
      alternatives: VALID_LETTERS.map((L) => ({
        letter: L,
        text: row[`alternative_${L.toLowerCase()}`],
        is_correct: L === correctAnswer,
      })),
    };
  }

  private normalizeCsvRecord(row: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      const key = k
        .replace(/^\ufeff/g, '')
        .trim()
        .toLowerCase();
      out[key] = String(v ?? '').trim();
    }
    return out;
  }

  private validateCsvRow(row: Record<string, string>, rowNumber: number) {
    const disc = row['discipline'] || row['subject'];
    const required = [
      'content',
      'question',
      'alternative_a',
      'alternative_b',
      'alternative_c',
      'alternative_d',
      'alternative_e',
      'correct_answer',
      'answer_explanation',
      'type',
      'year',
    ];

    if (!disc?.trim()) {
      throw new Error(`Row ${rowNumber}: missing required column 'discipline' or 'subject'`);
    }

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

    this.parseAdminType(row['type'], rowNumber);

    const year = parseInt(row['year'], 10);
    if (isNaN(year)) {
      throw new Error(`Row ${rowNumber}: year must be a number`);
    }
  }

  private parseAdminType(raw: string, rowNumber?: number): AdminQuestionType {
    const t = raw.trim().toUpperCase();
    if (t === 'SIMPLIFIED') {
      return AdminQuestionType.SIMPLIFIED;
    }
    if (t === 'ORIGINAL') {
      return AdminQuestionType.ORIGINAL;
    }
    const prefix = rowNumber != null ? `Row ${rowNumber}: ` : '';
    throw new Error(`${prefix}type must be SIMPLIFIED or ORIGINAL, got '${raw}'`);
  }

  private async resolvePathId(pathId?: string): Promise<string> {
    if (pathId) {
      const exists = await this.repository.pathExists(pathId);
      if (!exists) throw new BadRequestException('Path not found');
      return pathId;
    }
    const fallback = await this.repository.getFallbackPathId();
    if (!fallback) {
      throw new BadRequestException(
        'No path available; create a path or send pathId in the request',
      );
    }
    return fallback;
  }

  private async validateExam(mockExamId?: string) {
    if (!mockExamId) return;
    const examExists = await this.repository.examExists(mockExamId);
    if (!examExists) throw new BadRequestException('Exam not found');
  }

  private validateAlternativesArray(alternatives: { letter: string; is_correct: boolean }[]) {
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
