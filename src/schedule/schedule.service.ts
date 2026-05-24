import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WeekDay } from '@prisma/client';
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

const WEEKDAYS_UTC: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

@Injectable()
export class ScheduleService {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

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

    const paths = await this.scheduleRepository.findPathsOrdered();
    if (paths.length === 0) {
      throw new BadRequestException('Nenhum Path disponível para agendamento');
    }

    const slotsByWeekDay = this.buildSlotsByWeekDay(studyDays);
    const startDate = this.findNextScheduleDate(this.todayUtc(), [...slotsByWeekDay.keys()]);
    const scheduleEntries = this.buildScheduleEntries(startDate, slotsByWeekDay, paths, userId);

    await this.scheduleRepository.createStudyLogs(scheduleEntries);

    return {
      generatedItems: scheduleEntries.length,
      firstDate: this.formatDateUtc(scheduleEntries[0].date),
      lastDate: this.formatDateUtc(scheduleEntries[scheduleEntries.length - 1].date),
    };
  }

  async getWeekSchedule(userId: string, weekStart: string): Promise<WeekScheduleResponse> {
    if (!weekStart || !this.isWeekStartValid(weekStart)) {
      throw new BadRequestException('Parâmetro weekStart inválido');
    }

    const weekStartDate = this.parseUtcDateOnly(weekStart);
    const weekEndDate = this.addDaysUtc(weekStartDate, 6);
    const studyLogs = await this.scheduleRepository.findStudyLogsByRange(
      userId,
      weekStartDate,
      weekEndDate,
    );

    const logsByDate = new Map<string, WeekScheduleItem[]>();

    for (const log of studyLogs) {
      const dateKey = this.formatDateUtc(log.date);
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
      const currentDate = this.addDaysUtc(weekStartDate, offset);
      const dateKey = this.formatDateUtc(currentDate);
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
      weekStart: this.formatDateUtc(weekStartDate),
      weekEnd: this.formatDateUtc(weekEndDate),
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

  private buildSlotsByWeekDay(studyDays: Array<{ day: WeekDay; hour: number }>) {
    const slots = new Map<WeekDay, number[]>();

    for (const studyDay of studyDays) {
      const hours = slots.get(studyDay.day) ?? [];
      if (!hours.includes(studyDay.hour)) {
        hours.push(studyDay.hour);
      }
      slots.set(studyDay.day, hours);
    }

    for (const [day, hours] of slots.entries()) {
      hours.sort((a, b) => a - b);
      slots.set(day, hours);
    }

    return slots;
  }

  private buildScheduleEntries(
    startDate: Date,
    slotsByWeekDay: Map<WeekDay, number[]>,
    paths: Array<{ id: string }>,
    userId: string,
  ) {
    const entries: Array<{ date: Date; path_id: string; user_id: string; done: boolean }> = [];
    let currentDate = startDate;
    let pathIndex = 0;

    while (pathIndex < paths.length) {
      const weekDay = WEEKDAYS_UTC[currentDate.getUTCDay()];
      const hours = slotsByWeekDay.get(weekDay);
      if (hours) {
        for (const hour of hours) {
          if (pathIndex >= paths.length) break;
          entries.push({
            date: this.setUtcHour(currentDate, hour),
            path_id: paths[pathIndex].id,
            user_id: userId,
            done: false,
          });
          pathIndex += 1;
        }
      }
      currentDate = this.addDaysUtc(currentDate, 1);
    }

    return entries;
  }

  private todayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private findNextScheduleDate(startDate: Date, availableWeekDays: WeekDay[]) {
    for (let offset = 0; offset < 7; offset += 1) {
      const candidate = this.addDaysUtc(startDate, offset);
      if (availableWeekDays.includes(WEEKDAYS_UTC[candidate.getUTCDay()])) {
        return candidate;
      }
    }
    throw new BadRequestException('Defina ao menos uma janela de estudo');
  }

  private parseUtcDateOnly(value: string): Date {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    return new Date(Date.UTC(year, month - 1, day));
  }

  private formatDateUtc(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private formatTimeUtc(value: Date): string {
    const hours = value.getUTCHours().toString().padStart(2, '0');
    return `${hours}:00`;
  }

  private addDaysUtc(date: Date, days: number): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days, 0, 0, 0),
    );
  }

  private setUtcHour(date: Date, hour: number): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, 0, 0),
    );
  }

  private isWeekStartValid(value: string): boolean {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
      return false;
    }
    const date = this.parseUtcDateOnly(value);
    return this.formatDateUtc(date) === value;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }
}
