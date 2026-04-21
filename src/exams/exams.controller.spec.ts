import { Test, TestingModule } from '@nestjs/testing';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

describe('ExamsController', () => {
  let controller: ExamsController;
  let service: jest.Mocked<ExamsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamsController],
      providers: [
        {
          provide: ExamsService,
          useValue: {
            listAllExams: jest.fn(),
            importExamFromCsv: jest.fn(),
            updateExam: jest.fn(),
            deleteExamLogical: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExamsController>(ExamsController);
    service = module.get(ExamsService) as jest.Mocked<ExamsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listAllExams', () => {
    it('should return list of exams', async () => {
      const mockResponse = {
        data: [
          {
            id: 'exam1',
            title: 'Simulado ENEM',
            origin: 'ENEM',
            imageUrl: 'https://example.com/enem.png',
            totalQuestions: 180,
            status: 'PUBLISHED',
            days: [{ day: 1, totalQuestions: 90 }],
          },
        ],
      };

      service.listAllExams.mockResolvedValue(mockResponse as any);

      const result = await controller.listAllExams();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Simulado ENEM');
    });
  });

  describe('deleteExam', () => {
    it('should delete exam (soft delete)', async () => {
      service.deleteExamLogical.mockResolvedValue(void 0);

      const result = await controller.deleteExam('exam1');

      expect(service.deleteExamLogical).toHaveBeenCalledWith('exam1');
      expect(result).toBeUndefined();
    });
  });
});
