import { Test, TestingModule } from '@nestjs/testing';
import { SubjectController } from './subjects.controller';
import { SubjectService } from './subjects.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SubjectListingResponseDto } from './dto/subjectListing.dto.';
import { CountByPathAndTypeDto } from './dto/countByPathAndType.dto';

type JwtAuthUser = {
  userId: string;
  role: Role;
  planExpirationDate: string | null;
};

describe('SubjectController', () => {
  let controller: SubjectController;
  let service: jest.Mocked<SubjectService>;

  const mockUser: JwtAuthUser = {
    userId: 'user-123',
    role: Role.USER,
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

  it('should return subject listing', async () => {
    const mockResponse: SubjectListingResponseDto = {
      data: [
        {
          id: '1',
          name: 'Math',
          icon: 'math-icon',
          totalQuestions: 10,
          answeredQuestions: 5,
        },
      ],
    };

    service.findAllWithAnsweredByUser.mockResolvedValue(mockResponse);

    const result = await controller.subjectListing(mockUser);

    const fn = service.findAllWithAnsweredByUser.mockResolvedValue(
      mockResponse satisfies SubjectListingResponseDto,
    );

    expect(fn).toHaveBeenCalledWith('user-123');

    expect(result).toEqual(mockResponse);
  });

  it('should return subjects with progress (calculado)', async () => {
    const mockResponse: SubjectListingResponseDto = {
      data: [
        {
          id: '1',
          name: 'Math',
          icon: 'math-icon',
          totalQuestions: 10,
          answeredQuestions: 8,
        },
      ],
    };

    service.findAllWithAnsweredByUser.mockResolvedValue(mockResponse);

    const result = await controller.subjectListing(mockUser);

    const progress = (result.data[0].answeredQuestions / result.data[0].totalQuestions) * 100;

    expect(progress).toBe(80);
  });

  it('should throw NotFoundException when subject does not exist', async () => {
    service.findAllPathsBySubject.mockRejectedValue(new NotFoundException('Subject not found'));

    await expect(controller.pathsBySubject('invalid-id', mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when path does not exist', async () => {
    service.countByPathAndType.mockRejectedValue(new NotFoundException('Path not found'));

    await expect(controller.countQuestions('invalid-path', 'ORIGINAL', mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException for invalid type', async () => {
    await expect(
      controller.countQuestions('path-1', 'INVALID' as unknown as 'ORIGINAL', mockUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return count by type', async () => {
    const mockResponse: CountByPathAndTypeDto = { total: 10, answered: 5 };

    const spy = jest.spyOn(service, 'countByPathAndType').mockResolvedValue(mockResponse);

    const result = await controller.countQuestions('path-1', 'ORIGINAL', mockUser);

    expect(spy).toHaveBeenCalledWith('path-1', 'ORIGINAL', 'user-123');

    expect(result).toEqual(mockResponse);
  });
});
