import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Origin } from '@prisma/client';
import { AdminQuestionsRepository } from './admin-questions.repository';
import { AdminQuestionsService } from './admin-questions.service';
import { AdminQuestionType } from './dto/create-question.dto';
import { QuestionMediaService } from '../storage/question-media.service';
import { IconMediaService } from '../storage/icon-media.service';

type RepoMock = jest.Mocked<
  Pick<
    AdminQuestionsRepository,
    | 'create'
    | 'findMany'
    | 'findById'
    | 'update'
    | 'deleteAlternatives'
    | 'createAlternative'
    | 'findAllPaths'
    | 'findAllExams'
    | 'pathExists'
    | 'examExists'
    | 'getFallbackPathId'
    | 'pathByNameAndSubject'
    | 'findExamByIdOrName'
  >
>;

function mockAdminQuestion(overrides: Record<string, unknown> = {}) {
  const alts = ['A', 'B', 'C', 'D', 'E'].map((L, i) => ({
    id: `alt-${i}`,
    letter: L,
    text: L.toLowerCase(),
    is_correct: L === 'A',
    question_id: 'qid',
  }));
  return {
    id: 'qid',
    discipline: 'Mathematics',
    content: 'Geometria',
    text: 'Pergunta?',
    feedback: 'Exp',
    year: 2024,
    origin: 'ORIGINAL' as Origin,
    exam_id: null,
    bank: null,
    enable: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    path_id: 'path-id',
    exam_day_id: null,
    number: null,
    language: null,
    media_key: null,
    alternatives: alts,
    path: {
      id: 'path-id',
      name: 'Path',
      text: '',
      icon_url: '',
      schedule_position: 1,
      trail_position: 1,
      subject_id: 'sub',
    },
    exam: null,
    ...overrides,
  };
}

describe('AdminQuestionsService', () => {
  let service: AdminQuestionsService;
  let repository: RepoMock;

  const alternativesDto = {
    A: 'a',
    B: 'b',
    C: 'c',
    D: 'd',
    E: 'e',
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      deleteAlternatives: jest.fn(),
      createAlternative: jest.fn(),
      findAllPaths: jest.fn(),
      findAllExams: jest.fn(),
      pathExists: jest.fn(),
      examExists: jest.fn(),
      getFallbackPathId: jest.fn(),
      pathByNameAndSubject: jest.fn(),
      findExamByIdOrName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminQuestionsService,
        { provide: AdminQuestionsRepository, useValue: repository },
        {
          provide: QuestionMediaService,
          useValue: {
            resolveSignedUrl: jest.fn().mockResolvedValue(null),
            resolveSignedUrls: jest
              .fn()
              .mockImplementation((keys: (string | null)[]) =>
                Promise.resolve(keys.map(() => null)),
              ),
            uploadQuestionImage: jest.fn().mockResolvedValue('questions/qid/photo.png'),
          },
        },
        {
          provide: IconMediaService,
          useValue: {
            resolveIconUrls: jest
              .fn()
              .mockImplementation((refs: (string | null | undefined)[]) =>
                Promise.resolve(refs.map((ref) => ref ?? null)),
              ),
          },
        },
      ],
    }).compile();

    service = module.get<AdminQuestionsService>(AdminQuestionsService);
  });

  describe('create', () => {
    it('creates question when all validations pass', async () => {
      repository.pathExists.mockResolvedValue(true);
      repository.examExists.mockResolvedValue(true);
      repository.create.mockResolvedValue(mockAdminQuestion() as never);

      const result = await service.create({
        discipline: 'Mathematics',
        content: 'Geo',
        question: 'Q?',
        alternatives: alternativesDto,
        correctAnswer: 'A',
        answerExplanation: 'Exp',
        type: AdminQuestionType.ORIGINAL,
        year: 2024,
        pathId: 'path-id',
      });

      expect(result).toMatchObject({
        discipline: 'Mathematics',
        question: 'Pergunta?',
        correctAnswer: 'A',
      });
      expect(repository.create).toHaveBeenCalled();
    });

    it('persists number on create and returns it in the response', async () => {
      repository.pathExists.mockResolvedValue(true);
      repository.create.mockResolvedValue(mockAdminQuestion({ number: 7 }) as never);

      const result = await service.create({
        discipline: 'Mathematics',
        content: 'Geo',
        question: 'Q?',
        alternatives: alternativesDto,
        correctAnswer: 'A',
        answerExplanation: 'Exp',
        type: AdminQuestionType.ORIGINAL,
        year: 2024,
        pathId: 'path-id',
        number: 7,
      });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ number: 7 }));
      expect(result).toMatchObject({ number: 7 });
    });

    it('uses fallback path when pathId omitted', async () => {
      repository.getFallbackPathId.mockResolvedValue('fallback-path');
      repository.create.mockResolvedValue(mockAdminQuestion({ path_id: 'fallback-path' }) as never);

      await service.create({
        discipline: 'Mathematics',
        content: 'Geo',
        question: 'Q?',
        alternatives: alternativesDto,
        correctAnswer: 'B',
        answerExplanation: 'Exp',
        type: AdminQuestionType.SIMPLIFIED,
        year: 2024,
      });

      expect(repository.getFallbackPathId).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ path_id: 'fallback-path', origin: 'EXTERNAL' }),
      );
    });

    it('throws BadRequestException when pathId is invalid', async () => {
      repository.pathExists.mockResolvedValue(false);

      await expect(
        service.create({
          discipline: 'Mathematics',
          content: 'Geo',
          question: 'Q?',
          alternatives: alternativesDto,
          correctAnswer: 'A',
          answerExplanation: 'Exp',
          type: AdminQuestionType.ORIGINAL,
          year: 2024,
          pathId: 'bad-path',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('uses defaults for page/size and does not force enable=true', async () => {
      repository.findMany.mockResolvedValue({
        content: [mockAdminQuestion() as never],
        totalElements: 1,
      });

      const result = await service.findAll({ mockExamId: 'exam-1' } as never);

      expect(result.totalElements).toBe(1);
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ exam_id: 'exam-1' }),
        0,
        20,
      );
      expect(repository.findMany.mock.calls[0][0]).not.toHaveProperty('enable');
    });

    it('filters by enable when provided', async () => {
      repository.findMany.mockResolvedValue({ content: [], totalElements: 0 });

      await service.findAll({} as never, false);

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ enable: false }),
        0,
        20,
      );
    });
  });

  describe('findOne', () => {
    it('returns mapped question when found', async () => {
      repository.findById.mockResolvedValue(mockAdminQuestion() as never);
      await expect(service.findOne('qid')).resolves.toMatchObject({ id: 'qid' });
    });

    it('throws NotFoundException when question does not exist', async () => {
      repository.findById.mockResolvedValue(null as never);
      await expect(service.findOne('qid')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting enable=false', async () => {
      repository.findById.mockResolvedValue(mockAdminQuestion() as never);
      repository.update.mockResolvedValue(mockAdminQuestion({ enable: false }) as never);

      await service.remove('qid');

      expect(repository.update).toHaveBeenCalledWith('qid', { enable: false });
    });
  });

  describe('importCsv', () => {
    it('imports successfully when row is valid', async () => {
      repository.pathExists.mockResolvedValue(true);
      repository.getFallbackPathId.mockResolvedValue('p1');
      repository.pathByNameAndSubject.mockResolvedValue('p1');
      repository.create.mockResolvedValue(mockAdminQuestion() as never);

      const csv = [
        'discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year',
        'Mat,Geo,Texto?,a,b,c,d,e,A,Exp,ORIGINAL,2024',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
    });

    it('accepts subject column instead of discipline', async () => {
      repository.getFallbackPathId.mockResolvedValue('p1');
      repository.pathByNameAndSubject.mockResolvedValue('p1');
      repository.create.mockResolvedValue(mockAdminQuestion() as never);

      const csv = [
        'subject,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year',
        'Mat,Geo,Texto?,a,b,c,d,e,B,Exp,SIMPLIFIED,2024',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));
      expect(result.successCount).toBe(1);
    });

    it('reports errors per row without stopping the import', async () => {
      repository.getFallbackPathId.mockResolvedValue('p1');
      repository.pathByNameAndSubject.mockResolvedValue('p1');

      const csv = [
        'discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year',
        ',Geo,Texto?,a,b,c,d,e,A,Exp,ORIGINAL,2024',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.results[0].success).toBe(false);
    });

    it('reports error when correct_answer is invalid', async () => {
      repository.getFallbackPathId.mockResolvedValue('p1');
      repository.pathByNameAndSubject.mockResolvedValue('p1');
      repository.create.mockResolvedValue(mockAdminQuestion() as never);

      const csv = [
        'discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year',
        'Mat,Geo,Texto?,a,b,c,d,e,Z,Exp,ORIGINAL,2024',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.errorCount).toBe(1);
      expect(result.results[0].error).toContain('correct_answer');
    });

    it('should report error when topic not found by name and discipline', async () => {
      repository.pathExists.mockResolvedValue(false);
      repository.pathByNameAndSubject.mockResolvedValue(null);

      const csv = [
        'discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year',
        'Matemática,Geometria Avançada,Texto?,a,b,c,d,e,A,Exp,ORIGINAL,2024',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.errorCount).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.results[0].error).toContain(
        "Tópico 'Geometria Avançada' na disciplina 'Matemática' não encontrado.",
      );
    });

    it('should link exam when exam_title is given and found in db', async () => {
      repository.pathByNameAndSubject.mockResolvedValue('p1');
      repository.findExamByIdOrName.mockResolvedValue({ id: 'uuid-do-exame-123' });
      repository.create.mockResolvedValue(mockAdminQuestion() as never);

      const csv = [
        'exam_title,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year',
        'Simulado ENEM 2026,Mat,Geo,Texto?,a,b,c,d,e,A,Exp,ORIGINAL,2024',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.successCount).toBe(1);
      expect(repository.findExamByIdOrName).toHaveBeenCalledWith('Simulado ENEM 2026');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ exam_id: 'uuid-do-exame-123' }),
      );
    });

    it('should result in error when exam_title is given but not found in database', async () => {
      repository.pathByNameAndSubject.mockResolvedValue('p1');
      repository.findExamByIdOrName.mockResolvedValue(null);

      const csv = [
        'exam_title,discipline,content,question,alternative_a,alternative_b,alternative_c,alternative_d,alternative_e,correct_answer,answer_explanation,type,year',
        'Simulado FAKE,Mat,Geo,Texto?,a,b,c,d,e,A,Exp,ORIGINAL,2024',
      ].join('\n');

      const result = await service.importCsv(Buffer.from(csv));

      expect(result.errorCount).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.results[0].error).toContain("Simulado 'Simulado FAKE' não encontrado.");
    });
  });
});
