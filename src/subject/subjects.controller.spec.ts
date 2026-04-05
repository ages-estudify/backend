import { Test, TestingModule } from '@nestjs/testing';
import { SubjectController } from './subjects.controller';
import { SubjectService } from './subjects.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SubjectController', () => {
  let controller: SubjectController;
  let service: jest.Mocked<SubjectService>;

  const mockUser = {
    userId: 'user-123',
    role: 'USER',
    planExpirationDate: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectController],
      providers: [
        {
          provide: SubjectService,
          useValue: {
            findAllWithAnsweredByUser: jest.fn(),
            findAllPathsBySubject: jest.fn(),
            countByPathAndType: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SubjectController>(SubjectController);
    service = module.get(SubjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // listagem correta de disciplinas
  it('should return subject listing', async () => {
    const mockResponse = { data: [{ id: '1', name: 'Math' }] };

    service.findAllWithAnsweredByUser.mockResolvedValue(mockResponse as any);

    const result = await controller.subjectListing(mockUser as any);

    expect(service.findAllWithAnsweredByUser).toHaveBeenCalledWith('user-123');
    expect(result).toEqual(mockResponse);
  });

  // cálculo de progresso por usuário (verifica presença do campo)
  it('should return subjects with progress', async () => {
    const mockResponse = {
      data: [{ id: '1', progress: 80 }],
    };

    service.findAllWithAnsweredByUser.mockResolvedValue(mockResponse as any);

    const result = await controller.subjectListing(mockUser as any);

    expect(result.data[0]).toHaveProperty('progress');
  });

  // disciplina inexistente
  it('should throw NotFoundException when subject does not exist', async () => {
    service.findAllPathsBySubject.mockRejectedValue(
      new NotFoundException('Subject not found')
    );

    await expect(
      controller.pathsBySubject('invalid-id', mockUser as any)
    ).rejects.toThrow(NotFoundException);
  });

  // tópico inexistente
  it('should throw NotFoundException when path does not exist', async () => {
    service.countByPathAndType.mockRejectedValue(
      new NotFoundException('Path not found')
    );

    await expect(
      controller.countQuestions('invalid-path', 'ORIGINAL', mockUser as any)
    ).rejects.toThrow(NotFoundException);
  });

  // tipo inválido
  it('should throw BadRequestException for invalid type', async () => {
    await expect(
      controller.countQuestions('path-1', 'INVALID' as any, mockUser as any)
    ).rejects.toThrow(BadRequestException);
  });

  // contagem por tipo
  it('should return count by type', async () => {
    const mockResponse = { total: 10, answered: 5 };

    service.countByPathAndType.mockResolvedValue(mockResponse);

    const result = await controller.countQuestions(
      'path-1',
      'ORIGINAL',
      mockUser as any
    );

    expect(service.countByPathAndType).toHaveBeenCalledWith(
      'path-1',
      'ORIGINAL',
      'user-123'
    );
    expect(result).toEqual(mockResponse);
  });
});