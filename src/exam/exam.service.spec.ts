import { Test } from '@nestjs/testing';
import { ExamService } from './exam.service';
import { ExamRepository } from './exam.repository';
import { ExamMapper } from './mapper/exam.mapper';

describe('ExamService', () => {
  let service: ExamService;
  let repository: any;

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

  it('should call repository and mapper and return data', async () => {
    const raw = [
      { id: '1' },
      { id: '2' },
    ] as any;

    repository.findAllWithLastAttemptByUser.mockResolvedValue(raw);

    const mapperSpy = jest.spyOn(ExamMapper, 'toDtoList');

    const result = await service.findAllWithLastAttemptByUser('user1');

    expect(repository.findAllWithLastAttemptByUser).toHaveBeenCalledWith('user1');

    expect(mapperSpy).toHaveBeenCalledWith(raw);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should return empty array when repository returns nothing', async () => {
    repository.findAllWithLastAttemptByUser.mockResolvedValue([]);

    const result = await service.findAllWithLastAttemptByUser('user1');

    expect(result).toEqual({
      success: true,
      data: [],
    });
  });

  it('should propagate repository errors', async () => {
    repository.findAllWithLastAttemptByUser.mockRejectedValue(
      new Error('DB error'),
    );

    await expect(
      service.findAllWithLastAttemptByUser('user1'),
    ).rejects.toThrow('DB error');
  });
});
