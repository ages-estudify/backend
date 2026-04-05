import { Test, TestingModule } from '@nestjs/testing';
import { SubjectRepository } from './subjects.repository';
import { PrismaService } from '../prisma.service';

type MockPrisma = {
  subject: {
    findUnique: jest.Mock;
  };
  path: {
    findUnique: jest.Mock;
  };
  $queryRaw: jest.Mock;
};

describe('SubjectRepository', () => {
  let repository: SubjectRepository;
  let prisma: MockPrisma;

  beforeEach(async () => {
    const mockPrisma: MockPrisma = {
      subject: {
        findUnique: jest.fn(),
      },
      path: {
        findUnique: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<SubjectRepository>(SubjectRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // existsSubjectById
  it('should return true if subject exists', async () => {
    prisma.subject.findUnique.mockResolvedValue({ id: '1' });

    const result = await repository.existsSubjectById('1');

    expect(result).toBe(true);
  });

  it('should return false if subject does not exist', async () => {
    prisma.subject.findUnique.mockResolvedValue(null);

    const result = await repository.existsSubjectById('1');

    expect(result).toBe(false);
  });

  // existsPathById
  it('should return true if path exists', async () => {
    prisma.path.findUnique.mockResolvedValue({ id: '1' });

    const result = await repository.existsPathById('1');

    expect(result).toBe(true);
  });

  it('should return false if path does not exist', async () => {
    prisma.path.findUnique.mockResolvedValue(null);

    const result = await repository.existsPathById('1');

    expect(result).toBe(false);
  });

  // findAllWithAnsweredByUser
  it('should return subjects with question counts', async () => {
    const mockData = [
      {
        id: '1',
        name: 'Math',
        icon: 'icon.png',
        totalQuestions: 10,
        answeredQuestions: 5,
      },
    ];

    prisma.$queryRaw.mockResolvedValue(mockData);

    const result = await repository.findAllWithAnsweredByUser('user-1');

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  // findAllPathsBySubject
  it('should return paths with counts by type', async () => {
    const mockData = [
      {
        id: 'path-1',
        name: 'Algebra',
        text: 'intro',
        icon: 'icon.png',
        availableByType: { ORIGINAL: 10, EXTERNAL: 5 },
        answeredByType: { ORIGINAL: 3, EXTERNAL: 2 },
      },
    ];

    prisma.$queryRaw.mockResolvedValue(mockData);

    const result = await repository.findAllPathsBySubject(
      'sub-1',
      'user-1'
    );

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  // countByPathAndType
  it('should return count correctly', async () => {
    prisma.$queryRaw.mockResolvedValue([{ total: 10, answered: 4 }]);

    const result = await repository.countByPathAndType(
      'path-1',
      'ORIGINAL',
      'user-1'
    );

    expect(result).toEqual({ total: 10, answered: 4 });
  });

  it('should return zero when no data', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    const result = await repository.countByPathAndType(
      'path-1',
      'ORIGINAL',
      'user-1'
    );

    expect(result).toEqual({ total: 0, answered: 0 });
  });
});