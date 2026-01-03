const STORAGE_KEY = 'habit_tracker_active_dates';

export type HabitStoreListener = (activeDates: Set<string>) => void;

export class HabitStore {
  private activeDates: Set<string>;
  private listeners: Set<HabitStoreListener> = new Set();

  constructor() {
    this.activeDates = this.load();
  }

  private load(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const dates = JSON.parse(raw) as string[];
        return new Set(dates);
      }
    } catch (e) {
      console.warn('Failed to load habit state:', e);
    }
    return new Set();
  }

  private save(): void {
    try {
      const dates = Array.from(this.activeDates);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
    } catch (e) {
      console.warn('Failed to save habit state:', e);
    }
  }

  public isActive(dateKey: string): boolean {
    return this.activeDates.has(dateKey);
  }

  public toggle(dateKey: string): boolean {
    const wasActive = this.activeDates.has(dateKey);

    if (wasActive) {
      this.activeDates.delete(dateKey);
    } else {
      this.activeDates.add(dateKey);
    }

    this.save();
    this.notify();

    return !wasActive; // Returns new state
  }

  public setActive(dateKey: string, active: boolean): void {
    const wasActive = this.activeDates.has(dateKey);

    if (active && !wasActive) {
      this.activeDates.add(dateKey);
      this.save();
      this.notify();
    } else if (!active && wasActive) {
      this.activeDates.delete(dateKey);
      this.save();
      this.notify();
    }
  }

  public getActiveDates(): Set<string> {
    return new Set(this.activeDates);
  }

  /**
   * Get count of active dates in the current week (Monday-Sunday)
   */
  public getThisWeekCount(): number {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Adjust so Monday = 0, Sunday = 6
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Get Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - adjustedDay);
    monday.setHours(0, 0, 0, 0);

    let count = 0;
    for (const dateKey of this.activeDates) {
      const date = this.parseDate(dateKey);
      if (date && date >= monday && date <= today) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get current streak (consecutive days ending today or yesterday)
   */
  public getCurrentStreak(): number {
    if (this.activeDates.size === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayKey = this.formatDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = this.formatDate(yesterday);

    // Start from today if active, otherwise yesterday
    let startDate: Date;
    if (this.activeDates.has(todayKey)) {
      startDate = today;
    } else if (this.activeDates.has(yesterdayKey)) {
      startDate = yesterday;
    } else {
      return 0;
    }

    let streak = 0;
    const checkDate = new Date(startDate);

    while (true) {
      const key = this.formatDate(checkDate);
      if (this.activeDates.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get best streak ever from all stored dates
   */
  public getBestStreak(): number {
    if (this.activeDates.size === 0) return 0;

    // Sort all dates ascending
    const sortedDates = Array.from(this.activeDates)
      .map(key => this.parseDate(key))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length === 0) return 0;

    let bestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];

      // Check if consecutive (1 day apart)
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
      // diffDays === 0 means duplicate date, ignore
    }

    return bestStreak;
  }

  /**
   * Parse date key (YYYY-MM-DD) to Date object
   */
  private parseDate(dateKey: string): Date | null {
    const parts = dateKey.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Format Date to date key (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public subscribe(listener: HabitStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = new Set(this.activeDates);
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
