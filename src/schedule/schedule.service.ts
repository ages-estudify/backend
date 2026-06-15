import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WeekDay } from '@prisma/client';
import { interleavePathsBySubject } from './schedule-path-order';
import {
  addDaysUtc,
  buildExtensionEntries,
  buildScheduleEntries,
  buildSlotsByWeekDay,
  findNextScheduleDate,
  findNextSlotAfter,
  formatDateUtc,
  isWeekScheduleCovered,
  WEEKDAYS_UTC,
} from './schedule-slots';
import { ScheduleRepository } from './schedule.repository';

type ScheduleResponse = {
  generatedItems: number;
  firstDate: string;
  lastDate: string;
};

type WeekScheduleItem = {
  id: string;
  scheduledTime: string;
  disciplineId: string;
  disciplineName: string;
  disciplineIcon: string;
  topicId: string;
  topicName: string;
  completed: boolean;
};

type WeekScheduleDay = {
  date: string;
  dayOfWeek: WeekDay;
  items: WeekScheduleItem[];
};

type WeekScheduleResponse = {
  weekStart: string;
  weekEnd: string;
  days: WeekScheduleDay[];
};

type ScheduleItemUpdateResponse = {
  itemId: string;
  completed: boolean;
};

@Injectable()
export class ScheduleService {
  constructor(private readonly scheduleRepository: ScheduleRepository) { }

  async createInitialSchedule(userId: string): Promise<ScheduleResponse> {
    const user = await this.scheduleRepository.findUserById(userId);
    if (!user?.onboarding_completed) {
      throw new ConflictException('Onboarding não concluído');
    }

    const studyDays = await this.scheduleRepository.findStudyDaysByUser(userId);
    if (studyDays.length === 0) {
      throw new UnprocessableEntityException('Defina ao menos uma janela de estudo');
    }

    const existingLogs = await this.scheduleRepository.userHasStudyLogs(userId);
    if (existingLogs) {
      const bounds = await this.scheduleRepository.getStudyLogBounds(userId);
      return {
        generatedItems: 0,
        firstDate: bounds.firstDate,
        lastDate: bounds.lastDate,
      };
    }

    const catalog = await this.scheduleRepository.findPathsForSchedule();
    if (catalog.length === 0) {
      throw new BadRequestException('Nenhum Path disponível para agendamento');
    }

    const paths = interleavePathsBySubject(catalog);
    const slotsByWeekDay = buildSlotsByWeekDay(studyDays);
    const startDate = findNextScheduleDate(this.todayUtc(), [...slotsByWeekDay.keys()]);
    const scheduleEntries = buildScheduleEntries(startDate, slotsByWeekDay, paths, userId);

    await this.scheduleRepository.createStudyLogs(scheduleEntries);

    return {
      generatedItems: scheduleEntries.length,
      firstDate: formatDateUtc(scheduleEntries[0].date),
      lastDate: formatDateUtc(scheduleEntries[scheduleEntries.length - 1].date),
    };
  }

  async getWeekSchedule(userId: string, weekStart: string): Promise<WeekScheduleResponse> {
    if (!weekStart || !this.isWeekStartValid(weekStart)) {
      throw new BadRequestException('Parâmetro weekStart inválido');
    }

    const weekStartDate = this.parseUtcDateOnly(weekStart);
    const weekEndDate = addDaysUtc(weekStartDate, 6);

    await this.extendScheduleIfNeeded(userId, weekEndDate);

    const studyLogs = await this.scheduleRepository.findStudyLogsByRange(
      userId,
      weekStartDate,
      weekEndDate,
    );

    const logsByDate = new Map<string, WeekScheduleItem[]>();

    for (const log of studyLogs) {
      const dateKey = formatDateUtc(log.date);
      const items = logsByDate.get(dateKey) ?? [];
      items.push({
        id: log.id,
        scheduledTime: this.formatTimeUtc(log.date),
        disciplineId: log.path.subject.id,
        disciplineName: log.path.subject.name,
        disciplineIcon: log.path.subject.icon_url,
        topicId: log.path.id,
        topicName: log.path.name,
        completed: log.done,
      });
      logsByDate.set(dateKey, items);
    }

    const days: WeekScheduleDay[] = [];
    for (let offset = 0; offset < 7; offset++) {
      const currentDate = addDaysUtc(weekStartDate, offset);
      const dateKey = formatDateUtc(currentDate);
      const items = (logsByDate.get(dateKey) ?? []).sort((a, b) =>
        a.scheduledTime.localeCompare(b.scheduledTime),
      );
      days.push({
        date: dateKey,
        dayOfWeek: WEEKDAYS_UTC[currentDate.getUTCDay()],
        items,
      });
    }

    return {
      weekStart: formatDateUtc(weekStartDate),
      weekEnd: formatDateUtc(weekEndDate),
      days,
    };
  }

  async setScheduleItemCompleted(
    userId: string,
    itemId: string,
    completed: boolean,
  ): Promise<ScheduleItemUpdateResponse> {
    if (!itemId || !this.isUuid(itemId)) {
      throw new NotFoundException('Item não encontrado');
    }

    const log = await this.scheduleRepository.findStudyLogByIdAndUser(itemId, userId);
    if (!log) {
      throw new NotFoundException('Item não encontrado');
    }

    await this.scheduleRepository.updateStudyLogDone(log.id, completed);

    return {
      itemId: log.id,
      completed,
    };
  }

  private async extendScheduleIfNeeded(userId: string, weekEndDate: Date): Promise<void> {
    const maxLogDate = await this.scheduleRepository.getMaxStudyLogDate(userId);
    if (!maxLogDate || isWeekScheduleCovered(maxLogDate, weekEndDate)) {
      return;
    }

    const studyDays = await this.scheduleRepository.findStudyDaysByUser(userId);
    if (studyDays.length === 0) {
      return;
    }

    const catalog = await this.scheduleRepository.findPathsForSchedule();
    if (catalog.length === 0) {
      return;
    }

    const paths = interleavePathsBySubject(catalog);
    const slotsByWeekDay = buildSlotsByWeekDay(studyDays);
    const lastLog = await this.scheduleRepository.findLastStudyLog(userId);
    if (!lastLog) {
      return;
    }

    const slotOffset = await this.scheduleRepository.countStudyLogs(userId);
    const startSlot = findNextSlotAfter(lastLog.date, slotsByWeekDay);
    const entries = buildExtensionEntries(
      paths,
      slotsByWeekDay,
      userId,
      startSlot,
      slotOffset,
      maxLogDate,
      weekEndDate,
    );

    await this.scheduleRepository.extendStudyLogs(entries);
  }

  private todayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private parseUtcDateOnly(value: string): Date {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    return new Date(Date.UTC(year, month - 1, day));
  }

  private formatTimeUtc(value: Date): string {
    const hours = value.getUTCHours().toString().padStart(2, '0');
    return `${hours}:00`;
  }

  private isWeekStartValid(value: string): boolean {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
      return false;
    }
    const date = this.parseUtcDateOnly(value);
    return formatDateUtc(date) === value;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  async generateRecalculatedLogs(
    userId: string,
    studyDays: { day: WeekDay; hour: number }[],
    threshold: Date,
  ) {
    if (studyDays.length == 0) return [];

    const catalog = await this.scheduleRepository.findPathsForSchedule();

    if (catalog.length === 0) return [];

    const paths = interleavePathsBySubject(catalog);
    const slotsByWeekDay = buildSlotsByWeekDay(studyDays);

    const pastCount = await this.scheduleRepository.countPastOrDoneLogs(userId, threshold);

    let nextSlot = findNextSlotAfter(threshold, slotsByWeekDay);
    let pathIndex = pastCount % paths.length;

    const entries: Array<{
      date: Date;
      path_id: string;
      user_id: string;
      done: boolean
    }> = [];

    for (let i = 0; i < paths.length; i++) {
      entries.push({
        date: nextSlot,
        path_id: paths[pathIndex].id,
        user_id: userId,
        done: false,
      });

      pathIndex = (pathIndex + 1) % paths.length;
      nextSlot = findNextSlotAfter(nextSlot, slotsByWeekDay);
    }
    return entries;
  }
}
