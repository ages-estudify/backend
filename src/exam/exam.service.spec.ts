import { Test } from '@nestjs/testing';
import { ExamService } from './exam.service';
import { ExamRepository } from './exam.repository';

describe('ExamService', () => {
  let service: ExamService;
  let repository: any;

  const createExamItem = (overrides: any = {}) => ({
    id: '1',
    name: 'Exam 1',
    totalQuestions: 10,
    origin: 'internal',
    status: 'in_progress',
    answeredQuestions: 5,
    image_url: 'img.png',
    language: 'ENGLISH',
    totalQuestions1: 6,
    totalQuestions2: 4,
    isCompleted1: true,
    isCompleted2: false,
    ...overrides,
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExamService,
        {
          provide: ExamRepository,
          useValue: {
            findAllWithLastAttemptByUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ExamService);
    repository = module.get(ExamRepository);
  });

  it('should map exam correctly', async () => {
    repository.findAllWithLastAttemptByUser.mockResolvedValue([createExamItem()]);

    const result = await service.findAllWithLastAttemptByUser('user1');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);

    const exam = result.data[0];

    expect(exam.id).toBe('1');
    expect(exam.name).toBe('Exam 1');
    expect(exam.origin).toBe('internal');
    expect(exam.languages).toBe('ENGLISH');
    expect(exam.answeredQuestions).toBe(5);
  });

  it('should correctly map days structure', async () => {
    repository.findAllWithLastAttemptByUser.mockResolvedValue([createExamItem()]);

    const result = await service.findAllWithLastAttemptByUser('user1');

    const days = result.data[0].days;

    expect(days).toHaveLength(2);

    expect(days[0]).toEqual({
      day: 1,
      totalQuestions: 6,
      isCompleted: true,
    });

    expect(days[1]).toEqual({
      day: 2,
      totalQuestions: 4,
      isCompleted: false,
    });
  });

  it('should handle multiple exams', async () => {
    repository.findAllWithLastAttemptByUser.mockResolvedValue([
      createExamItem({ id: '1', name: 'Exam 1' }),
      createExamItem({ id: '2', name: 'Exam 2', origin: 'external' }),
    ]);

    const result = await service.findAllWithLastAttemptByUser('user1');

    expect(result.data).toHaveLength(2);
    expect(result.data[1].origin).toBe('external');
  });

  it('should handle null language', async () => {
    repository.findAllWithLastAttemptByUser.mockResolvedValue([createExamItem({ language: null })]);

    const result = await service.findAllWithLastAttemptByUser('user1');

    expect(result.data[0].languages).toBeNull();
  });

  it('should handle empty repository response', async () => {
    repository.findAllWithLastAttemptByUser.mockResolvedValue([]);

    const result = await service.findAllWithLastAttemptByUser('user1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
