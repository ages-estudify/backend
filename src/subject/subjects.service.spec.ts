import { Test, TestingModule } from '@nestjs/testing';
import { SubjectService } from './subjects.service';
import { SubjectRepository } from './subjects.repository';
import { NotFoundException } from '@nestjs/common';
import { IconMediaService } from '../storage/icon-media.service';

describe('SubjectService', () => {
  let service: SubjectService;
  let repository: jest.Mocked<SubjectRepository>;
  const iconMediaMocks = {
    resolveIconUrl: jest.fn(),
    resolveIconUrls: jest.fn(),
  };

  beforeEach(async () => {
    iconMediaMocks.resolveIconUrls.mockImplementation(async (refs: (string | null | undefined)[]) =>
      refs.map((ref) => ref ?? null),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectService,
        {
          provide: SubjectRepository,
          useValue: {
            findAllWithAnsweredByUser: jest.fn(),
            findAllPathsBySubject: jest.fn(),
            existsSubjectById: jest.fn(),
            existsPathById: jest.fn(),
            countByPathAndType: jest.fn(),
          },
        },
        { provide: IconMediaService, useValue: iconMediaMocks },
      ],
    }).compile();

    service = module.get<SubjectService>(SubjectService);
    repository = module.get(SubjectRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // LISTAGEM DE DISCIPLINAS
  it('deve listar disciplinas corretamente', async () => {
    repository.findAllWithAnsweredByUser.mockResolvedValue([
      {
        id: '1',
        name: 'Math',
        icon: 'icon',
        totalQuestions: 10,
        answeredQuestions: 5,
      },
    ]);

    const result = await service.findAllWithAnsweredByUser('user1');

    expect(result).toEqual({
      data: [
        {
          id: '1',
          name: 'Math',
          icon: 'icon',
          totalQuestions: 10,
          answeredQuestions: 5,
        },
      ],
    });

    const spy = jest.spyOn(repository, 'findAllWithAnsweredByUser');

    await service.findAllWithAnsweredByUser('user1');

    expect(spy).toHaveBeenCalledWith('user1');
  });

  // PROGRESSO POR USUÁRIO
  it('deve calcular progresso por usuário (paths)', async () => {
    repository.existsSubjectById.mockResolvedValue(true);

    repository.findAllPathsBySubject.mockResolvedValue([
      {
        id: 'path1',
        name: 'Algebra',
        text: 'desc',
        icon_key: '/icons/topics/matematica-algebra.png',
        availableByType: { ORIGINAL: 10, EXTERNAL: 5 },
        answeredByType: { ORIGINAL: 4, EXTERNAL: 2 },
      },
    ]);

    const result = await service.findAllPathsBySubject('sub1', 'user1');

    expect(result.data[0].availableByType.ORIGINAL).toBe(10);
    expect(result.data[0].answeredByType.ORIGINAL).toBe(4);
  });

  it('resolve icon_url via IconMediaService', async () => {
    repository.existsSubjectById.mockResolvedValue(true);
    repository.findAllPathsBySubject.mockResolvedValue([
      {
        id: 'path1',
        name: 'Algebra',
        text: 'desc',
        icon_key: 'paths/path1/icon.png',
        availableByType: { ORIGINAL: 1, EXTERNAL: 1 },
        answeredByType: { ORIGINAL: 0, EXTERNAL: 0 },
      },
    ]);
    iconMediaMocks.resolveIconUrls.mockResolvedValue(['https://s3.example.com/signed-icon.png']);

    const result = await service.findAllPathsBySubject('sub1', 'user1');

    expect(iconMediaMocks.resolveIconUrls).toHaveBeenCalledWith(['paths/path1/icon.png']);
    expect(result.data[0].icon_url).toBe('https://s3.example.com/signed-icon.png');
  });

  // DISCIPLINA INEXISTENTE
  it('deve lançar erro se disciplina não existir', async () => {
    repository.existsSubjectById.mockResolvedValue(false);

    await expect(service.findAllPathsBySubject('invalid', 'user1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // CONTAGEM POR TIPO
  it('deve contar questões por tipo corretamente', async () => {
    repository.existsPathById.mockResolvedValue(true);

    repository.countByPathAndType.mockResolvedValue({
      total: 20,
      answered: 8,
    });

    const result = await service.countByPathAndType('path1', 'ORIGINAL', 'user1');

    expect(result).toEqual({
      total: 20,
      answered: 8,
    });
  });

  // TÓPICO INEXISTENTE
  it('deve lançar erro se tópico não existir', async () => {
    repository.existsPathById.mockResolvedValue(false);

    await expect(service.countByPathAndType('invalid', 'ORIGINAL', 'user1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // TIPO INVÁLIDO
  it('deve lidar com tipo inválido (não chamar repo)', async () => {
    repository.existsPathById.mockResolvedValue(true);

    await expect(
      service.countByPathAndType('path1', 'INVALID' as unknown as 'ORIGINAL' | 'EXTERNAL', 'user1'),
    ).rejects.toThrow();
  });
});
