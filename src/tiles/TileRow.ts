import * as THREE from 'three';
import { DayTile } from './DayTile';
import { TilePool } from './TilePool';
import { HabitStore } from '../state/HabitStore';
import { LightingSystem } from '../scene/LightingSystem';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { BallTrajectory } from '../animation/BallTrajectory';
import { getTileData, dateToKey, indexToDate, calculateTileX } from '../state/DateUtils';
import { TileData } from '../state/types';
import { TILE_SPACING, WEEK_GAP, VISIBLE_TILE_BUFFER, THROW_START_HEIGHT, BALL_REST_Y } from '../constants';

export class TileRow extends THREE.Group {
  private pool: TilePool;
  private habitStore: HabitStore;
  private lightingSystem: LightingSystem;
  private physicsWorld: PhysicsWorld;

  private visibleRange: { start: number; end: number } = { start: 0, end: 0 };
  private tileDataCache: Map<number, TileData> = new Map();

  constructor(pool: TilePool, habitStore: HabitStore, lightingSystem: LightingSystem, physicsWorld: PhysicsWorld) {
    super();
    this.pool = pool;
    this.habitStore = habitStore;
    this.lightingSystem = lightingSystem;
    this.physicsWorld = physicsWorld;
  }

  /**
   * Initialize visible tiles centered on today
   */
  public initialize(viewportWidth: number): void {
    const tilesVisible = Math.ceil(viewportWidth / TILE_SPACING) + VISIBLE_TILE_BUFFER * 2;
    const halfVisible = Math.floor(tilesVisible / 2);

    this.visibleRange = {
      start: -halfVisible,
      end: halfVisible,
    };

    this.updateVisibleTiles();
  }

  /**
   * Update based on scroll offset
   */
  public updateScroll(scrollOffset: number, viewportWidth: number): void {
    // Sync physics bodies with scroll
    this.physicsWorld.updateScrollOffset(scrollOffset);

    // Move the container (camera stays fixed)
    this.position.x = -scrollOffset;

    // Calculate which indices should be visible
    const tilesVisible = Math.ceil(viewportWidth / TILE_SPACING) + VISIBLE_TILE_BUFFER * 2;
    const halfVisible = Math.floor(tilesVisible / 2);

    const centerIndex = Math.round(scrollOffset / TILE_SPACING);

    const newStart = centerIndex - halfVisible;
    const newEnd = centerIndex + halfVisible;

    if (newStart !== this.visibleRange.start || newEnd !== this.visibleRange.end) {
      this.visibleRange = { start: newStart, end: newEnd };
      this.updateVisibleTiles();
    }

    // Update light positions for active tiles (lights are in world space)
    for (const [dateKey, tile] of this.pool.getActiveTiles()) {
      if (this.habitStore.isActive(dateKey)) {
        tile.updateWorldMatrix(true, false);
        this.lightingSystem.updateLightPosition(dateKey, tile.getWorldCenter());
      }
    }
  }

  /**
   * Update which tiles are visible
   */
  private updateVisibleTiles(): void {
    const { start, end } = this.visibleRange;

    // Release tiles outside visible range
    const activeKeys = this.pool.getActiveDateKeys();
    for (const dateKey of activeKeys) {
      const tile = this.pool.get(dateKey);
      if (tile) {
        // Find the index for this tile
        const tileIndex = this.findTileIndex(dateKey);
        if (tileIndex !== null && (tileIndex < start - 1 || tileIndex > end + 1)) {
          this.releaseTile(dateKey, tileIndex);
        }
      }
    }

    // Spawn tiles for visible range
    let prevTileData: TileData | null = null;
    for (let i = start; i <= end; i++) {
      const dateKey = dateToKey(indexToDate(i));

      if (!this.pool.has(dateKey)) {
        prevTileData = this.spawnTile(i, prevTileData);
      } else {
        // Update prevTileData from cache
        prevTileData = this.tileDataCache.get(i) || null;
      }
    }
  }

  /**
   * Spawn a new tile for an index
   */
  private spawnTile(index: number, prevTileData: TileData | null): TileData {
    const dateKey = dateToKey(indexToDate(index));
    const isActive = this.habitStore.isActive(dateKey);

    const tileData = getTileData(index, isActive, prevTileData);
    this.tileDataCache.set(index, tileData);

    const tile = this.pool.acquire(dateKey);
    if (!tile) return tileData;

    tile.configure(tileData);

    // Position tile
    const x = calculateTileX(index, TILE_SPACING, WEEK_GAP);
    tile.position.set(x, 0, 0);

    this.add(tile);

    // Add active light if needed
    if (isActive) {
      this.lightingSystem.addActiveLight(dateKey, tile.getWorldCenter());
    }

    // Create crate collider for physics
    tile.updateWorldMatrix(true, false);
    this.physicsWorld.createCrateCollider(dateKey, tile.getWorldCenter());

    return tileData;
  }

  /**
   * Release a tile back to pool
   */
  private releaseTile(dateKey: string, index: number): void {
    const tile = this.pool.get(dateKey);
    if (tile) {
      this.remove(tile);
      this.lightingSystem.removeActiveLight(dateKey);
      this.physicsWorld.removeCrateCollider(dateKey);
      this.pool.release(dateKey);
      this.tileDataCache.delete(index);
    }
  }

  /**
   * Find the index for a date key
   */
  private findTileIndex(dateKey: string): number | null {
    for (const [index, data] of this.tileDataCache) {
      if (data.dateKey === dateKey) {
        return index;
      }
    }
    return null;
  }

  /**
   * Toggle a tile's active state
   */
  public toggleTile(dateKey: string): void {
    const newState = this.habitStore.toggle(dateKey);
    const tile = this.pool.get(dateKey);

    if (!tile) return;

    tile.setActive(newState);

    if (newState) {
      // Toggle ON - throw ball with physics
      const ball = tile.getBall();
      ball.visible = true;

      // Ensure world matrix is up to date before getting world position
      tile.updateWorldMatrix(true, false);
      const worldCenter = tile.getWorldCenter();

      // Calculate start position (above the crate)
      const startPos = worldCenter.clone();
      startPos.y = THROW_START_HEIGHT;
      startPos.x += (Math.random() - 0.5) * 2;
      startPos.z += (Math.random() - 0.5) * 1;

      // Target position (resting in crate)
      const targetPos = worldCenter.clone();
      targetPos.y = BALL_REST_Y;

      // Create physics body and throw
      this.physicsWorld.createBallBody(dateKey, ball, startPos);
      this.physicsWorld.throwBall(dateKey, startPos, targetPos);

      this.lightingSystem.addActiveLight(dateKey, worldCenter);
    } else {
      // Toggle OFF - eject ball with physics
      const ball = tile.getBall();

      // Check if physics body exists, if so use physics eject
      const physicsBall = this.physicsWorld.getBall(dateKey);
      if (physicsBall) {
        this.physicsWorld.ejectBall(dateKey);
        // Remove physics body after ball falls out of view
        setTimeout(() => {
          this.physicsWorld.removeBall(dateKey);
          ball.visible = false;
        }, 1500);
      } else {
        // Fallback to animation if no physics body
        BallTrajectory.createEjectAnimation(ball, () => {
          ball.visible = false;
        })?.start();
      }

      this.lightingSystem.removeActiveLight(dateKey);
    }
  }

  /**
   * Get tile from a mesh (for raycasting)
   */
  public getTileFromMesh(mesh: THREE.Object3D): DayTile | null {
    // Walk up the parent chain to find the DayTile
    let current: THREE.Object3D | null = mesh;
    while (current) {
      if (current instanceof DayTile) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * Get all crate meshes for raycasting
   */
  public getCrateMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    for (const tile of this.pool.getActiveTiles().values()) {
      meshes.push(...tile.getCrateMeshes());
    }
    return meshes;
  }

  public dispose(): void {
    this.pool.dispose();
    this.tileDataCache.clear();
  }
}
