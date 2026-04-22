import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      saveOnboarding: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: OnboardingRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    repository = mockRepository;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('completeOnboarding', () => {
    it('should call repository with correct data when payload is complete', async () => {
      repository.saveOnboarding.mockResolvedValue(undefined);

      const dto = {
        desiredCourse: 'Engenharia de Software',
        desiredUniversity: 'PUCRS',
        preferredLanguage: 'ENGLISH' as any,
        studyHours: { MONDAY: [18, 19], WEDNESDAY: [20] },
      };

      await service.completeOnboarding('user-id', dto);

      expect(repository.saveOnboarding).toHaveBeenCalledWith('user-id', dto);
    });

    it('should call repository when payload is empty', async () => {
      repository.saveOnboarding.mockResolvedValue(undefined);

      await service.completeOnboarding('user-id', {});

      expect(repository.saveOnboarding).toHaveBeenCalledWith('user-id', {});
    });

    it('should throw BadRequestException when studyHours is empty object', async () => {
      await expect(service.completeOnboarding('user-id', { studyHours: {} })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when studyHours has invalid day', async () => {
      await expect(
        service.completeOnboarding('user-id', { studyHours: { INVALID_DAY: [18] } as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when hours array is empty', async () => {
      await expect(
        service.completeOnboarding('user-id', { studyHours: { MONDAY: [] } }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when hour is out of range', async () => {
      await expect(
        service.completeOnboarding('user-id', { studyHours: { MONDAY: [25] } }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when hour is negative', async () => {
      await expect(
        service.completeOnboarding('user-id', { studyHours: { MONDAY: [-1] } }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when hours have duplicates', async () => {
      await expect(
        service.completeOnboarding('user-id', { studyHours: { MONDAY: [18, 18] } }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not call repository when validation fails', async () => {
      await expect(
        service.completeOnboarding('user-id', { studyHours: { MONDAY: [] } }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.saveOnboarding).not.toHaveBeenCalled();
    });
  });
});
