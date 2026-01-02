import {
  format,
  startOfWeek,
  getISOWeek,
  getISOWeekYear,
  addDays,
  isSameDay,
  differenceInDays,
} from 'date-fns';
import { TileData } from './types';

// Reference date: today at midnight
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

/**
 * Convert a date index (0 = today, -1 = yesterday, 1 = tomorrow) to a date
 */
export function indexToDate(index: number): Date {
  return addDays(TODAY, index);
}

/**
 * Convert a date to an index relative to today
 */
export function dateToIndex(date: Date): number {
  return differenceInDays(date, TODAY);
}

/**
 * Get the canonical date key for storage (YYYY-MM-DD)
 */
export function dateToKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a date key back to a Date object
 */
export function keyToDate(key: string): Date {
  return new Date(key);
}

/**
 * Get the day of week (0 = Monday, 6 = Sunday) from a date
 */
export function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0 system
}

/**
 * Determine which month "owns" a given week (majority of days rule)
 */
export function getWeekMajorityMonth(date: Date): { month: number; year: number } {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday

  const monthCounts: Map<string, number> = new Map();

  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const key = `${day.getFullYear()}-${day.getMonth()}`;
    monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
  }

  // Find month with most days
  let maxCount = 0;
  let majorityKey = '';
  for (const [key, count] of monthCounts) {
    if (count > maxCount) {
      maxCount = count;
      majorityKey = key;
    }
  }

  const [year, month] = majorityKey.split('-').map(Number);
  return { month, year };
}

/**
 * Generate tile data for a given date index
 */
export function getTileData(
  index: number,
  isActive: boolean,
  prevTileData: TileData | null
): TileData {
  const date = indexToDate(index);
  const dateKey = dateToKey(date);
  const dayOfMonth = date.getDate();
  const dayOfWeek = getDayOfWeek(date);
  const isToday = isSameDay(date, TODAY);
  const weekNumber = getISOWeek(date);
  const weekYear = getISOWeekYear(date);
  const isWeekStart = dayOfWeek === 0;

  // Determine week label (show on Monday)
  const weekLabel = isWeekStart ? `W${String(weekNumber).padStart(2, '0')}` : null;

  // Determine month label (show when week's majority month changes)
  let monthLabel: string | null = null;
  const currentMajority = getWeekMajorityMonth(date);

  if (prevTileData) {
    const prevDate = keyToDate(prevTileData.dateKey);
    const prevMajority = getWeekMajorityMonth(prevDate);

    if (
      currentMajority.month !== prevMajority.month ||
      currentMajority.year !== prevMajority.year
    ) {
      monthLabel = format(new Date(currentMajority.year, currentMajority.month, 1), 'MMMM yyyy');
    }
  } else {
    // First tile, always show month label
    monthLabel = format(new Date(currentMajority.year, currentMajority.month, 1), 'MMMM yyyy');
  }

  return {
    dateKey,
    dayOfMonth,
    dayOfWeek,
    isToday,
    isActive,
    weekNumber,
    weekYear,
    monthLabel,
    weekLabel,
    isWeekStart,
  };
}

/**
 * Calculate the X position for a tile, including week gaps
 */
export function calculateTileX(index: number, tileSpacing: number, weekGap: number): number {
  // Count how many week boundaries are between index and 0
  let gaps = 0;
  const sign = index >= 0 ? 1 : -1;

  for (let i = 0; i !== index; i += sign) {
    const checkDate = indexToDate(i + sign);
    if (getDayOfWeek(checkDate) === 0) {
      gaps += sign;
    }
  }

  return index * tileSpacing + gaps * weekGap;
}
