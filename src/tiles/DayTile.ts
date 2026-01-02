import * as THREE from 'three';
import { Text } from 'troika-three-text';
import { TileLabel } from './TileLabel';
import { TileData } from '../state/types';
import { BALL_REST_Y } from '../constants';

export class DayTile extends THREE.Group {
  public dateKey: string = '';
  public isActive: boolean = false;

  private crate: THREE.Group;
  private ball: THREE.Group;
  private dayLabel: Text;
  private weekLabel: Text | null = null;
  private monthLabel: Text | null = null;

  // Reference to base models for cloning
  private static crateTemplate: THREE.Group | null = null;
  private static ballTemplate: THREE.Group | null = null;

  constructor() {
    super();

    // Clone from templates
    if (!DayTile.crateTemplate || !DayTile.ballTemplate) {
      throw new Error('DayTile templates not initialized. Call DayTile.setTemplates first.');
    }

    this.crate = DayTile.crateTemplate.clone();
    this.ball = DayTile.ballTemplate.clone();
    this.ball.visible = false;
    this.ball.position.y = BALL_REST_Y;

    this.dayLabel = TileLabel.createDayLabel(1, false);

    this.add(this.crate);
    this.add(this.ball);
    this.add(this.dayLabel);
  }

  /**
   * Set the template models for cloning (call once during init)
   */
  public static setTemplates(crate: THREE.Group, ball: THREE.Group): void {
    DayTile.crateTemplate = crate;
    DayTile.ballTemplate = ball;
  }

  /**
   * Configure the tile for a specific date
   */
  public configure(data: TileData): void {
    this.dateKey = data.dateKey;
    this.isActive = data.isActive;

    // Update day label
    TileLabel.updateDayLabel(this.dayLabel, data.dayOfMonth, data.isToday);

    // Show/hide ball based on active state (no animation during configure)
    this.ball.visible = data.isActive;
    if (data.isActive) {
      this.ball.position.y = BALL_REST_Y;
    }

    // Handle week label
    if (data.weekLabel) {
      if (!this.weekLabel) {
        this.weekLabel = TileLabel.createWeekLabel(data.weekLabel);
        this.add(this.weekLabel);
      } else {
        this.weekLabel.text = data.weekLabel;
        this.weekLabel.visible = true;
        this.weekLabel.sync();
      }
    } else if (this.weekLabel) {
      this.weekLabel.visible = false;
    }

    // Handle month label
    if (data.monthLabel) {
      if (!this.monthLabel) {
        this.monthLabel = TileLabel.createMonthLabel(data.monthLabel);
        this.add(this.monthLabel);
      } else {
        this.monthLabel.text = data.monthLabel;
        this.monthLabel.visible = true;
        this.monthLabel.sync();
      }
    } else if (this.monthLabel) {
      this.monthLabel.visible = false;
    }
  }

  /**
   * Reset tile for reuse in pool
   */
  public reset(): void {
    this.dateKey = '';
    this.isActive = false;
    this.ball.visible = false;
    this.ball.position.set(0, BALL_REST_Y, 0);
    this.ball.rotation.set(0, 0, 0);

    if (this.weekLabel) {
      this.weekLabel.visible = false;
    }
    if (this.monthLabel) {
      this.monthLabel.visible = false;
    }
  }

  /**
   * Get the ball object for animations
   */
  public getBall(): THREE.Group {
    return this.ball;
  }

  /**
   * Get the crate meshes for raycasting
   */
  public getCrateMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    this.crate.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });
    return meshes;
  }

  /**
   * Get world position for the tile center
   */
  public getWorldCenter(): THREE.Vector3 {
    const worldPos = new THREE.Vector3();
    this.getWorldPosition(worldPos);
    return worldPos;
  }

  /**
   * Set the active state with animation
   */
  public setActive(active: boolean): void {
    this.isActive = active;
    // Animation is handled externally by TileRow
  }

  public dispose(): void {
    this.dayLabel.dispose();
    this.weekLabel?.dispose();
    this.monthLabel?.dispose();
  }
}
