/**
 * Scoreboard UI overlay showing weekly progress and streak
 */

const WEEKLY_GOAL = 7;

export class ScoreboardUI {
  private container: HTMLDivElement;
  private thisWeekNumber: HTMLSpanElement | null = null;
  private streakNumber: HTMLSpanElement | null = null;
  private bestValue: HTMLSpanElement | null = null;

  constructor() {
    this.container = this.createPanel();
    document.body.appendChild(this.container);
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'scoreboard';
    panel.innerHTML = `
      <div class="scoreboard-content">
        <div class="scoreboard-panel left">
          <span class="big-number" id="this-week-number">0</span>
          <div class="bottom-row">
            <span class="label">GOAL</span>
            <span class="value">${WEEKLY_GOAL}</span>
          </div>
        </div>
        <div class="scoreboard-panel right">
          <span class="big-number" id="streak-number">0</span>
          <div class="bottom-row">
            <span class="label">BEST</span>
            <span class="value" id="best-value">0</span>
          </div>
        </div>
      </div>
    `;

    this.injectStyles();

    // Prevent canvas interaction
    panel.addEventListener('pointerdown', (e) => e.stopPropagation());
    panel.addEventListener('pointermove', (e) => e.stopPropagation());
    panel.addEventListener('pointerup', (e) => e.stopPropagation());
    panel.addEventListener('wheel', (e) => e.stopPropagation());

    // Store references immediately
    this.thisWeekNumber = panel.querySelector('#this-week-number');
    this.streakNumber = panel.querySelector('#streak-number');
    this.bestValue = panel.querySelector('#best-value');

    return panel;
  }

  private injectStyles(): void {
    if (document.getElementById('scoreboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'scoreboard-styles';
    style.textContent = `
      #scoreboard {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        pointer-events: none;
      }

      .scoreboard-content {
        position: relative;
        width: 600px;
        height: 300px;
        background-image: url('/scoreboard/scoreboard_bg_1.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        display: flex;
      }

      .scoreboard-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        position: relative;
        pointer-events: auto;
        padding-bottom: 22px;
      }

      .scoreboard-panel.left {
        padding-left: 14px;
      }

      .scoreboard-panel.right {
        padding-right: 14px;
      }

      .big-number {
        font-family: 'Orbitron', sans-serif;
        font-weight: 900;
        font-size: 96px;
        color: #000000;
        text-align: center;
        margin-bottom: 27px;
        text-shadow: none;
        line-height: 1;
      }

      .bottom-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .bottom-row .label {
        font-family: 'Orbitron', sans-serif;
        font-weight: 400;
        font-size: 18px;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .bottom-row .value {
        font-family: 'Orbitron', sans-serif;
        font-weight: 900;
        font-size: 28px;
        color: #d4a843;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update scoreboard values
   */
  public update(thisWeek: number, streak: number, bestStreak: number): void {
    if (this.thisWeekNumber) {
      this.thisWeekNumber.textContent = String(thisWeek);
    }
    if (this.streakNumber) {
      this.streakNumber.textContent = String(streak);
    }
    if (this.bestValue) {
      this.bestValue.textContent = String(bestStreak);
    }
  }

  public dispose(): void {
    this.container.remove();
    const styles = document.getElementById('scoreboard-styles');
    styles?.remove();
  }
}
