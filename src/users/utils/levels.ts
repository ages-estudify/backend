import { LevelDto } from '../dto/user-stats.dto';

const levels = [
  { min: 0, max: 9, level: 1 },
  { min: 10, max: 29, level: 2 },
  { min: 30, max: 59, level: 3 },
  { min: 60, max: 99, level: 4 },
  { min: 100, max: 149, level: 5 },
  { min: 150, max: 209, level: 6 },
  { min: 210, max: 279, level: 7 },
  { min: 280, max: 359, level: 8 },
  { min: 360, max: 449, level: 9 },
  { min: 450, max: Infinity, level: 10 },
];

export function getMaxLevel(): number {
  return levels.at(-1)?.level ?? 1;
}

export function getLevel(value: number): LevelDto {
  return {
    current: levels.find(({ min, max }) => value >= min && value <= max)?.level ?? 1,

    max: getMaxLevel(),
  };
}
