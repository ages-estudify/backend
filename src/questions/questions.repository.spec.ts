import { QuestionsRepository } from './questions.repository';
import { PrismaService } from '../prisma.service';

/* eslint-disable @typescript-eslint/unbound-method */
describe('QuestionsRepository', () => {
  let repository: QuestionsRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      question: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      answer: {
        count: jest.fn(),
      },
      path: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    repository = new QuestionsRepository(prisma);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should map ORIGINAL to ORIGINAL origin when counting by type', async () => {
    prisma.question.count.mockResolvedValue(4);

    const result = await repository.countByPathAndType('path-id', 'ORIGINAL');

    expect(result).toBe(4);
    expect(prisma.question.count).toHaveBeenCalledWith({
      where: {
        path_id: 'path-id',
        origin: 'ORIGINAL',
      },
    });
  });

  it('should map SIMPLIFIED to EXTERNAL origin when counting by type', async () => {
    prisma.question.count.mockResolvedValue(2);

    const result = await repository.countByPathAndType('path-id', 'SIMPLIFIED');

    expect(result).toBe(2);
    expect(prisma.question.count).toHaveBeenCalledWith({
      where: {
        path_id: 'path-id',
        origin: 'EXTERNAL',
      },
    });
  });

  it('pathExists should return true when path is found', async () => {
    prisma.path.findUnique.mockResolvedValue({ id: 'path-id' } as never);

    const result = await repository.pathExists('path-id');

    expect(result).toBe(true);
    expect(prisma.path.findUnique).toHaveBeenCalledWith({ where: { id: 'path-id' } });
  });

  it('findByPathAndType should request only unanswered questions when excludeAnswered is true', async () => {
    const questionRow = [
      {
        id: 'q1',
        text: 'Pergunta 1',
        image_url: null,
        origin: 'ORIGINAL',
        alternatives: [{ id: 'a1', text: 'A', letter: 'A', is_correct: true }],
      },
    ];

    prisma.question.findMany.mockResolvedValue(questionRow as never);

    const result = await repository.findByPathAndType(
      'path-id',
      'ORIGINAL',
      true,
      true,
      'user-id',
      5,
    );

    expect(result).toEqual(questionRow);
    expect(prisma.question.findMany).toHaveBeenCalledWith({
      where: {
        path_id: 'path-id',
        origin: 'ORIGINAL',
        answers: {
          none: {
            user_id: 'user-id',
          },
        },
      },
      include: {
        alternatives: {
          select: {
            id: true,
            text: true,
            letter: true,
            is_correct: true,
          },
        },
      },
    });
  });

  it('findByPathAndType should include all answered questions when excludeAnswered is false and retrieveWrong is true', async () => {
    const unansweredQuestion = {
      id: 'q1',
      text: 'Pergunta 1',
      image_url: null,
      origin: 'ORIGINAL',
      alternatives: [{ id: 'a1', text: 'A', letter: 'A', is_correct: true }],
    };
    const answeredQuestion = {
      id: 'q2',
      text: 'Pergunta 2',
      image_url: null,
      origin: 'ORIGINAL',
      alternatives: [{ id: 'a2', text: 'B', letter: 'B', is_correct: true }],
    };

    prisma.question.findMany
      .mockResolvedValueOnce([unansweredQuestion] as never) // unanswered
      .mockResolvedValueOnce([answeredQuestion] as never); // all answered

    const result = await repository.findByPathAndType(
      'path-id',
      'ORIGINAL',
      false,
      true,
      'user-id',
      5,
    );

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([unansweredQuestion, answeredQuestion]));
  });

  it('findByPathAndType should include only correct answered questions when excludeAnswered is false and retrieveWrong is false', async () => {
    const unansweredQuestion = {
      id: 'q1',
      text: 'Pergunta 1',
      image_url: null,
      origin: 'ORIGINAL',
      alternatives: [{ id: 'a1', text: 'A', letter: 'A', is_correct: true }],
    };
    const answeredQuestion = {
      id: 'q2',
      text: 'Pergunta 2',
      image_url: null,
      origin: 'ORIGINAL',
      alternatives: [{ id: 'a2', text: 'B', letter: 'B', is_correct: true }],
    };

    prisma.question.findMany
      .mockResolvedValueOnce([unansweredQuestion] as never) // unanswered
      .mockResolvedValueOnce([answeredQuestion] as never); // all answered

    const result = await repository.findByPathAndType(
      'path-id',
      'ORIGINAL',
      false,
      false,
      'user-id',
      5,
    );

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([unansweredQuestion, answeredQuestion]));
  });
});
/* eslint-enable @typescript-eslint/unbound-method */
