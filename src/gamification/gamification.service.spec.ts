import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from './gamification.service';
import { UsersRepository } from '../users/users.repository';
import { NotFoundException } from '@nestjs/common';

const createEarnCoinsDto = (overrides: Partial<any> = {}) => ({
  userId: 'user-123',
  isCorrect: true,
  isSimulated: false,
  ...overrides,
});

const createUserBuilder = (overrides: Partial<any> = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  full_name: 'Test User',
  email: 'test@example.com',
  phone_number: '123456789',
  role: 'USER',
  plan_end_date: null,
  streak: null,
  coins: 0,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  enable: true,
  desired_course: null,
  desired_exam: null,
  last_active: null,
  birth_date: null,
  ...overrides,
});

const createUserWithCoins = (coins: number) => createUserBuilder({ coins });
const createCorrectAnswerDto = () => createEarnCoinsDto({ isCorrect: true, isSimulated: false });
const createIncorrectAnswerDto = () => createEarnCoinsDto({ isCorrect: false, isSimulated: false });
const createSimulatedAnswerDto = () => createEarnCoinsDto({ isCorrect: true, isSimulated: true });

describe('GamificationService', () => {
  let service: GamificationService;
  let usersRepository: any;

  beforeEach(async () => {
    const mockUsersRepository = {
      findUniqueById: jest.fn(),
      incrementCoins: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    usersRepository = mockUsersRepository;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('earnCoins', () => {
    it('should return coinsEarned 0 and totalCoins when isCorrect is false', async () => {
      const dto = createIncorrectAnswerDto();
      const user = createUserWithCoins(10);
      usersRepository.findUniqueById.mockResolvedValue(user);

      const result = await service.earnCoins(dto);

      expect(result).toEqual({ coinsEarned: 0, totalCoins: 10 });
      expect(usersRepository.findUniqueById).toHaveBeenCalledWith(dto.userId);
      expect(usersRepository.incrementCoins).not.toHaveBeenCalled();
    });

    it('should increment coins and return coinsEarned 1 and totalCoins when isCorrect is true and not simulated', async () => {
      const dto = createCorrectAnswerDto();
      usersRepository.incrementCoins.mockResolvedValue({ coins: 11 });

      const result = await service.earnCoins(dto);

      expect(result).toEqual({ coinsEarned: 1, totalCoins: 11 });
      expect(usersRepository.incrementCoins).toHaveBeenCalledWith(dto.userId, 1);
      expect(usersRepository.findUniqueById).not.toHaveBeenCalled();
    });

    it('should return coinsEarned 0 when isCorrect is true but isSimulated is true', async () => {
      const dto = createSimulatedAnswerDto();
      const user = createUserWithCoins(10);
      usersRepository.findUniqueById.mockResolvedValue(user);

      const result = await service.earnCoins(dto);

      expect(result).toEqual({ coinsEarned: 0, totalCoins: 10 });
      expect(usersRepository.findUniqueById).toHaveBeenCalledWith(dto.userId);
      expect(usersRepository.incrementCoins).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found for incorrect answer', async () => {
      const dto = createIncorrectAnswerDto();
      usersRepository.findUniqueById.mockResolvedValue(null);

      await expect(service.earnCoins(dto)).rejects.toThrow(NotFoundException);
    });

    it('should handle null coins as 0', async () => {
      const dto = createIncorrectAnswerDto();
      const user = createUserBuilder({ coins: null });
      usersRepository.findUniqueById.mockResolvedValue(user);

      const result = await service.earnCoins(dto);

      expect(result).toEqual({ coinsEarned: 0, totalCoins: 0 });
    });
  });
});
