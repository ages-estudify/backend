import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WeekDay } from '@prisma/client';
import { ScheduleRepository } from './schedule.repository';
import { ScheduleService } from './schedule.service';

type ScheduleRepositoryMock = {
  findUserById: jest.Mock<Promise<{ onboarding_completed: boolean } | null>, [string]>;
  findStudyDaysByUser: jest.Mock<Promise<Array<{ day: WeekDay; hour: number }>>, [string]>;
  userHasStudyLogs: jest.Mock<Promise<boolean>, [string]>;
  getStudyLogBounds: jest.Mock<Promise<{ firstDate: string; lastDate: string }>, [string]>;
  findPathsForSchedule: jest.Mock<
    Promise<Array<{ id: string; subject_id: string; schedule_position: number }>>,
    []
  >;
  createStudyLogs: jest.Mock<
    Promise<void>,
    [Array<{ date: Date; path_id: string; user_id: string; done: boolean }>]
  >;
  getMaxStudyLogDate: jest.Mock<Promise<Date | null>, [string]>;
  countStudyLogs: jest.Mock<Promise<number>, [string]>;
  findLastStudyLog: jest.Mock<Promise<{ date: Date } | null>, [string]>;
  extendStudyLogs: jest.Mock<
    Promise<void>,
    [Array<{ date: Date; path_id: string; user_id: string; done: boolean }>]
  >;
  findStudyLogsByRange: jest.Mock<
    Promise<
      Array<{
        id: string;
        date: Date;
        done: boolean;
        path: {
          id: string;
          name: string;
          subject: { id: string; name: string; icon_url: string };
        };
      }>
    >,
    [string, Date, Date]
  >;
  findStudyLogByIdAndUser: jest.Mock<Promise<{ id: string } | null>, [string, string]>;
  updateStudyLogDone: jest.Mock<Promise<any>, [string, boolean]>;
};

describe('ScheduleService', () => {
  let service: ScheduleService;
  let repository: ScheduleRepositoryMock;
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-24T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    repository = {
      findUserById: jest.fn(),
      findStudyDaysByUser: jest.fn(),
      userHasStudyLogs: jest.fn(),
      getStudyLogBounds: jest.fn(),
      findPathsForSchedule: jest.fn(),
      createStudyLogs: jest.fn(),
      getMaxStudyLogDate: jest.fn(),
      countStudyLogs: jest.fn(),
      findLastStudyLog: jest.fn(),
      extendStudyLogs: jest.fn(),
      findStudyLogsByRange: jest.fn(),
      findStudyLogByIdAndUser: jest.fn(),
      updateStudyLogDone: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: ScheduleRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInitialSchedule', () => {
    it('throws if onboarding is not completed', async () => {
      repository.findUserById.mockResolvedValue({ onboarding_completed: false });

      await expect(service.createInitialSchedule('user-id')).rejects.toThrow(ConflictException);
    });

    it('throws when there are no study days', async () => {
      repository.findUserById.mockResolvedValue({ onboarding_completed: true });
      repository.findStudyDaysByUser.mockResolvedValue([]);

      await expect(service.createInitialSchedule('user-id')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('returns existing bounds when schedule already exists', async () => {
      repository.findUserById.mockResolvedValue({ onboarding_completed: true });
      repository.findStudyDaysByUser.mockResolvedValue([{ day: WeekDay.SATURDAY, hour: 18 }]);
      repository.userHasStudyLogs.mockResolvedValue(true);
      repository.getStudyLogBounds.mockResolvedValue({
        firstDate: '2026-05-24',
        lastDate: '2026-08-04',
      });

      const result = await service.createInitialSchedule('user-id');

      expect(result).toEqual({
        generatedItems: 0,
        firstDate: '2026-05-24',
        lastDate: '2026-08-04',
      });
      expect(repository.createStudyLogs).not.toHaveBeenCalled();
    });

    it('throws when there are no paths available', async () => {
      repository.findUserById.mockResolvedValue({ onboarding_completed: true });
      repository.findStudyDaysByUser.mockResolvedValue([{ day: WeekDay.SATURDAY, hour: 18 }]);
      repository.userHasStudyLogs.mockResolvedValue(false);
      repository.findPathsForSchedule.mockResolvedValue([]);

      await expect(service.createInitialSchedule('user-id')).rejects.toThrow(BadRequestException);
    });

    it('creates a schedule cycle using interleaved paths', async () => {
      repository.findUserById.mockResolvedValue({ onboarding_completed: true });
      repository.findStudyDaysByUser.mockResolvedValue([
        { day: WeekDay.SATURDAY, hour: 18 },
        { day: WeekDay.SATURDAY, hour: 19 },
        { day: WeekDay.MONDAY, hour: 20 },
      ]);
      repository.userHasStudyLogs.mockResolvedValue(false);
      repository.findPathsForSchedule.mockResolvedValue([
        { id: 'p1', subject_id: 'math', schedule_position: 1 },
        { id: 'p2', subject_id: 'math', schedule_position: 2 },
        { id: 'p3', subject_id: 'hist', schedule_position: 3 },
      ]);
      repository.createStudyLogs.mockResolvedValue(undefined);

      const result = await service.createInitialSchedule('user-id');

      expect(repository.createStudyLogs).toHaveBeenCalledTimes(1);
      const createdEntries = repository.createStudyLogs.mock.calls[0][0];
      expect(createdEntries).toHaveLength(3);
      expect(createdEntries.map((entry) => entry.path_id)).toEqual(['p1', 'p3', 'p2']);
      expect(createdEntries[0].date.toISOString()).toBe('2026-05-25T20:00:00.000Z');
      expect(createdEntries[1].date.toISOString()).toBe('2026-05-30T18:00:00.000Z');
      expect(createdEntries[2].date.toISOString()).toBe('2026-05-30T19:00:00.000Z');
      expect(result).toEqual({
        generatedItems: 3,
        firstDate: '2026-05-25',
        lastDate: '2026-05-30',
      });
    });
  });

  describe('getWeekSchedule', () => {
    it('throws when weekStart is invalid', async () => {
      await expect(service.getWeekSchedule('user-id', 'invalid-date')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('does not extend when the user has no study logs yet', async () => {
      repository.getMaxStudyLogDate.mockResolvedValue(null);
      repository.findStudyLogsByRange.mockResolvedValue([]);

      await service.getWeekSchedule('user-id', '2026-06-01');

      expect(repository.extendStudyLogs).not.toHaveBeenCalled();
    });

    it('does not extend when the requested week is already covered', async () => {
      repository.getMaxStudyLogDate.mockResolvedValue(new Date('2026-06-10T18:00:00.000Z'));
      repository.findStudyLogsByRange.mockResolvedValue([]);

      await service.getWeekSchedule('user-id', '2026-05-24');

      expect(repository.extendStudyLogs).not.toHaveBeenCalled();
    });

    it('does not extend when the last log is on the last day of the requested week', async () => {
      repository.getMaxStudyLogDate.mockResolvedValue(new Date('2026-06-07T10:00:00.000Z'));
      repository.findStudyLogsByRange.mockResolvedValue([]);

      await service.getWeekSchedule('user-id', '2026-06-01');

      expect(repository.extendStudyLogs).not.toHaveBeenCalled();
    });

    it('does not extend when the catalog is empty', async () => {
      repository.getMaxStudyLogDate.mockResolvedValue(new Date('2026-05-24T18:00:00.000Z'));
      repository.findStudyDaysByUser.mockResolvedValue([{ day: WeekDay.MONDAY, hour: 20 }]);
      repository.findPathsForSchedule.mockResolvedValue([]);
      repository.findStudyLogsByRange.mockResolvedValue([]);

      await service.getWeekSchedule('user-id', '2026-06-01');

      expect(repository.extendStudyLogs).not.toHaveBeenCalled();
    });

    it('does not extend when the user has no study days', async () => {
      repository.getMaxStudyLogDate.mockResolvedValue(new Date('2026-05-24T18:00:00.000Z'));
      repository.findStudyDaysByUser.mockResolvedValue([]);
      repository.findStudyLogsByRange.mockResolvedValue([]);

      await service.getWeekSchedule('user-id', '2026-06-01');

      expect(repository.extendStudyLogs).not.toHaveBeenCalled();
    });

    it('extends the schedule in full cycles when the week is beyond the last log', async () => {
      repository.getMaxStudyLogDate.mockResolvedValue(new Date('2026-05-30T19:00:00.000Z'));
      repository.findStudyDaysByUser.mockResolvedValue([
        { day: WeekDay.SATURDAY, hour: 18 },
        { day: WeekDay.SATURDAY, hour: 19 },
        { day: WeekDay.MONDAY, hour: 20 },
      ]);
      repository.findPathsForSchedule.mockResolvedValue([
        { id: 'p1', subject_id: 'math', schedule_position: 1 },
        { id: 'p2', subject_id: 'math', schedule_position: 2 },
        { id: 'p3', subject_id: 'hist', schedule_position: 3 },
      ]);
      repository.findLastStudyLog.mockResolvedValue({ date: new Date('2026-05-30T19:00:00.000Z') });
      repository.countStudyLogs.mockResolvedValue(3);
      repository.extendStudyLogs.mockResolvedValue(undefined);
      repository.findStudyLogsByRange.mockResolvedValue([]);

      await service.getWeekSchedule('user-id', '2026-06-01');

      expect(repository.extendStudyLogs).toHaveBeenCalledTimes(1);
      const extendedEntries = repository.extendStudyLogs.mock.calls[0][0];
      expect(extendedEntries).toHaveLength(6);
      expect(extendedEntries.length % 3).toBe(0);
      expect(extendedEntries[0].path_id).toBe('p1');
      expect(extendedEntries.map((entry) => entry.path_id).slice(0, 3)).toEqual(['p1', 'p3', 'p2']);
    });

    it('returns seven days including empty days', async () => {
      repository.getMaxStudyLogDate.mockResolvedValue(new Date('2026-06-10T18:00:00.000Z'));
      repository.findStudyLogsByRange.mockResolvedValue([
        {
          id: 'l1',
          date: new Date('2026-05-24T18:00:00.000Z'),
          done: false,
          path: {
            id: 'path1',
            name: 'Geometria Plana',
            subject: { id: 'sub1', name: 'Matemática', icon_url: 'icon' },
          },
        },
        {
          id: 'l2',
          date: new Date('2026-05-26T20:00:00.000Z'),
          done: true,
          path: {
            id: 'path2',
            name: 'Álgebra',
            subject: { id: 'sub1', name: 'Matemática', icon_url: 'icon' },
          },
        },
        {
          id: 'l3',
          date: new Date('2026-05-30T20:00:00.000Z'),
          done: false,
          path: {
            id: 'path3',
            name: 'História',
            subject: { id: 'sub2', name: 'História', icon_url: 'icon2' },
          },
        },
      ]);

      const result = await service.getWeekSchedule('user-id', '2026-05-24');

      expect(result.weekStart).toBe('2026-05-24');
      expect(result.weekEnd).toBe('2026-05-30');
      expect(result.days).toHaveLength(7);
      expect(result.days[0].date).toBe('2026-05-24');
      expect(result.days[0].items).toHaveLength(1);
      expect(result.days[0].items[0].scheduledTime).toBe('18:00');
      expect(result.days[2].items).toHaveLength(1);
      expect(result.days[6].items).toHaveLength(1);
      expect(result.days[1].items).toEqual([]);
    });
  });

  describe('setScheduleItemCompleted', () => {
    it('throws if item id is invalid', async () => {
      await expect(
        service.setScheduleItemCompleted('user-id', 'invalid-uuid', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws if item is not found for the user', async () => {
      repository.findStudyLogByIdAndUser.mockResolvedValue(null);

      await expect(
        service.setScheduleItemCompleted('user-id', '550e8400-e29b-41d4-a716-446655440000', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the study log done state', async () => {
      repository.findStudyLogByIdAndUser.mockResolvedValue({ id: 'log-id' });
      repository.updateStudyLogDone.mockResolvedValue({});

      const result = await service.setScheduleItemCompleted(
        'user-id',
        '550e8400-e29b-41d4-a716-446655440000',
        true,
      );

      expect(repository.updateStudyLogDone).toHaveBeenCalledWith('log-id', true);
      expect(result).toEqual({ itemId: 'log-id', completed: true });
    });
  });
});
