import { WeekDay } from '@prisma/client';

export const WEEKDAYS_UTC: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

export function addDaysUtc(date: Date, days: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days, 0, 0, 0),
  );
}

export function setUtcHour(date: Date, hour: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, 0, 0),
  );
}

export function formatDateUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function buildSlotsByWeekDay(studyDays: Array<{ day: WeekDay; hour: number }>) {
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

export function findNextScheduleDate(startDate: Date, availableWeekDays: WeekDay[]): Date {
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDaysUtc(startDate, offset);
    if (availableWeekDays.includes(WEEKDAYS_UTC[candidate.getUTCDay()])) {
      return candidate;
    }
  }
  throw new Error('No study day available in the next week');
}

export function findNextSlotAfter(after: Date, slotsByWeekDay: Map<WeekDay, number[]>): Date {
  for (let dayOffset = 0; dayOffset < 366 * 2; dayOffset += 1) {
    const currentDate = addDaysUtc(after, dayOffset);
    const weekDay = WEEKDAYS_UTC[currentDate.getUTCDay()];
    const hours = slotsByWeekDay.get(weekDay);
    if (!hours) continue;

    for (const hour of hours) {
      const slot = setUtcHour(currentDate, hour);
      if (slot.getTime() > after.getTime()) {
        return slot;
      }
    }
  }

  throw new Error('Unable to find the next study slot');
}

export function buildScheduleEntries(
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
          date: setUtcHour(currentDate, hour),
          path_id: paths[pathIndex].id,
          user_id: userId,
          done: false,
        });
        pathIndex += 1;
      }
    }
    currentDate = addDaysUtc(currentDate, 1);
  }

  return entries;
}

export function isWeekScheduleCovered(lastLogDate: Date, weekEndDate: Date): boolean {
  return formatDateUtc(lastLogDate) >= formatDateUtc(weekEndDate);
}

/**
 * Extends the schedule with full catalog cycles until the week is covered (by calendar day).
 * Each cycle always completes every path, even if the week becomes covered mid-cycle.
 */
export function buildExtensionEntries(
  paths: Array<{ id: string }>,
  slotsByWeekDay: Map<WeekDay, number[]>,
  userId: string,
  startSlot: Date,
  startPathIndex: number,
  lastCoveredDate: Date,
  weekEndDate: Date,
) {
  const entries: Array<{ date: Date; path_id: string; user_id: string; done: boolean }> = [];
  let pathIndex = startPathIndex;
  let nextSlot = startSlot;
  let coverageDate = lastCoveredDate;

  while (!isWeekScheduleCovered(coverageDate, weekEndDate)) {
    for (let cycleIndex = 0; cycleIndex < paths.length; cycleIndex += 1) {
      entries.push({
        date: nextSlot,
        path_id: paths[pathIndex % paths.length].id,
        user_id: userId,
        done: false,
      });
      pathIndex += 1;
      nextSlot = findNextSlotAfter(nextSlot, slotsByWeekDay);
    }
    coverageDate = entries[entries.length - 1].date;
  }

  return entries;
}
