export interface TileData {
  dateKey: string; // "YYYY-MM-DD"
  dayOfMonth: number; // 1-31
  dayOfWeek: number; // 0-6 (Mon=0)
  isToday: boolean;
  isActive: boolean;
  weekNumber: number; // ISO week 1-53
  weekYear: number; // Year the week belongs to
  monthLabel: string | null; // "January 2026" at month transitions
  weekLabel: string | null; // "W01" at week starts
  isWeekStart: boolean; // Monday
}

export interface HabitState {
  activeDates: Set<string>;
}

export interface ScrollState {
  offset: number;
  velocity: number;
}
