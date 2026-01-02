import TWEEN from '@tweenjs/tween.js';

export class AnimationManager {
  private isRunning = false;

  /**
   * Start the animation loop (call once)
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
  }

  /**
   * Update all tweens (call every frame)
   */
  public update(time?: number): void {
    TWEEN.update(time);
  }

  /**
   * Stop all animations
   */
  public stopAll(): void {
    TWEEN.removeAll();
  }
}
