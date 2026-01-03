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

// Day name abbreviations (Monday = 0)
const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

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
  _prevTileData: TileData | null
): TileData {
  const date = indexToDate(index);
  const dateKey = dateToKey(date);
  const dayOfMonth = date.getDate();
  const dayOfWeek = getDayOfWeek(date);
  const dayName = DAY_NAMES[dayOfWeek];
  const isToday = isSameDay(date, TODAY);
  const weekNumber = getISOWeek(date);
  const weekYear = getISOWeekYear(date);
  const isWeekStart = dayOfWeek === 0;

  // Determine week label (show on Monday)
  const weekLabel = isWeekStart ? `W${String(weekNumber).padStart(2, '0')}` : null;

  // Determine month label (show on first day of the month)
  let monthLabel: string | null = null;
  if (dayOfMonth === 1) {
    monthLabel = format(date, 'MMMM yyyy');
  }

  return {
    dateKey,
    dayOfMonth,
    dayOfWeek,
    dayName,
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
 * Calculate the X position for a tile, including week gaps.
 * Gap appears BEFORE Monday (between Sunday and Monday).
 */
export function calculateTileX(index: number, tileSpacing: number, weekGap: number): number {
  // Count Monday crossings between index 0 and target index
  // Gap should appear before each Monday
  let gaps = 0;

  if (index > 0) {
    // Future dates: count Mondays from 1 to index (inclusive)
    for (let i = 1; i <= index; i++) {
      if (getDayOfWeek(indexToDate(i)) === 0) {
        gaps++;
      }
    }
  } else if (index < 0) {
    // Past dates: count Mondays from index+1 to 0 (exclusive of 0)
    // Each Monday we pass going backward means a gap before it
    for (let i = index + 1; i <= 0; i++) {
      if (getDayOfWeek(indexToDate(i)) === 0) {
        gaps--;
      }
    }
  }

  return index * tileSpacing + gaps * weekGap;
}
