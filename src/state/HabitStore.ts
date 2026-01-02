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
