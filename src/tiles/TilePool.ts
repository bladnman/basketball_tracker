import { DayTile } from './DayTile';
import { POOL_SIZE } from '../constants';

export class TilePool {
  private pool: DayTile[] = [];
  private active: Map<string, DayTile> = new Map();

  constructor() {
    // Pre-allocate tiles
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(new DayTile());
    }
  }

  /**
   * Acquire a tile from the pool
   */
  public acquire(dateKey: string): DayTile | null {
    // Check if already active
    if (this.active.has(dateKey)) {
      return this.active.get(dateKey)!;
    }

    // Get from pool
    const tile = this.pool.pop();
    if (!tile) {
      console.warn('Tile pool exhausted');
      return null;
    }

    this.active.set(dateKey, tile);
    return tile;
  }

  /**
   * Release a tile back to the pool
   */
  public release(dateKey: string): void {
    const tile = this.active.get(dateKey);
    if (tile) {
      tile.reset();
      this.pool.push(tile);
      this.active.delete(dateKey);
    }
  }

  /**
   * Get a tile by date key
   */
  public get(dateKey: string): DayTile | undefined {
    return this.active.get(dateKey);
  }

  /**
   * Check if a tile is active for a date
   */
  public has(dateKey: string): boolean {
    return this.active.has(dateKey);
  }

  /**
   * Get all active tiles
   */
  public getActiveTiles(): Map<string, DayTile> {
    return this.active;
  }

  /**
   * Get all active date keys
   */
  public getActiveDateKeys(): string[] {
    return Array.from(this.active.keys());
  }

  /**
   * Dispose all tiles
   */
  public dispose(): void {
    for (const tile of this.pool) {
      tile.dispose();
    }
    for (const tile of this.active.values()) {
      tile.dispose();
    }
    this.pool = [];
    this.active.clear();
  }
}
