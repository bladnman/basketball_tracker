/**
 * Debug panel for tuning physics parameters
 * Toggle with 'D' key
 */

export interface PhysicsConfig {
  ballRadius: number;
  wallThickness: number;
  crateDepth: number;
  crateWidth: number;
  crateHeight: number;
  gravity: number;
  linearDamping: number;
  angularDamping: number;
  sleepThreshold: number; // Velocity below this = force stop
  bounciness: number;     // Ball restitution (0 = no bounce, 1 = full bounce)
  showColliders: boolean;
  debugMode: boolean;     // Limits to 3 tiles for easier debugging
}

export type ConfigChangeCallback = (config: PhysicsConfig) => void;

const DEFAULT_CONFIG: PhysicsConfig = {
  ballRadius: 0.65,
  wallThickness: 0.1,
  crateDepth: 1.9,
  crateWidth: 1.9,
  crateHeight: 2.0,
  gravity: -14,
  linearDamping: 0.1,
  angularDamping: 0.08,
  sleepThreshold: 0.3,
  bounciness: 0.5,
  showColliders: false, // Off by default, enabled when panel opens
  debugMode: false,     // Off by default, enabled when panel opens
};

export class DebugPanel {
  private container: HTMLDivElement;
  private config: PhysicsConfig;
  private onConfigChange: ConfigChangeCallback | null = null;
  private isVisible: boolean = false;
  private jsonOutput: HTMLTextAreaElement | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 150;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.container = this.createPanel();
    document.body.appendChild(this.container);
    this.setupKeyboardToggle();
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.innerHTML = `
      <div class="debug-header">
        <span class="debug-title">PHYSICS DEBUG</span>
        <button class="debug-close">×</button>
      </div>
      <div class="debug-content">
        <div class="debug-section">
          <div class="slider-row">
            <label>Ball Radius</label>
            <input type="range" id="ballRadius" min="0.3" max="1.0" step="0.05" value="${this.config.ballRadius}">
            <span class="slider-value" id="ballRadius-val">${this.config.ballRadius.toFixed(2)}</span>
          </div>
          <div class="slider-row">
            <label>Wall Thickness</label>
            <input type="range" id="wallThickness" min="0.02" max="0.3" step="0.02" value="${this.config.wallThickness}">
            <span class="slider-value" id="wallThickness-val">${this.config.wallThickness.toFixed(2)}</span>
          </div>
          <div class="slider-row">
            <label>Crate Depth</label>
            <input type="range" id="crateDepth" min="1.0" max="2.5" step="0.1" value="${this.config.crateDepth}">
            <span class="slider-value" id="crateDepth-val">${this.config.crateDepth.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Crate Width</label>
            <input type="range" id="crateWidth" min="1.5" max="3.0" step="0.1" value="${this.config.crateWidth}">
            <span class="slider-value" id="crateWidth-val">${this.config.crateWidth.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Crate Height</label>
            <input type="range" id="crateHeight" min="0.5" max="2.5" step="0.1" value="${this.config.crateHeight}">
            <span class="slider-value" id="crateHeight-val">${this.config.crateHeight.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Gravity</label>
            <input type="range" id="gravity" min="-25" max="-5" step="1" value="${this.config.gravity}">
            <span class="slider-value" id="gravity-val">${this.config.gravity.toFixed(0)}</span>
          </div>
          <div class="slider-row">
            <label>Linear Damping</label>
            <input type="range" id="linearDamping" min="0" max="0.5" step="0.02" value="${this.config.linearDamping}">
            <span class="slider-value" id="linearDamping-val">${this.config.linearDamping.toFixed(2)}</span>
          </div>
          <div class="slider-row">
            <label>Angular Damping</label>
            <input type="range" id="angularDamping" min="0" max="0.5" step="0.02" value="${this.config.angularDamping}">
            <span class="slider-value" id="angularDamping-val">${this.config.angularDamping.toFixed(2)}</span>
          </div>
          <div class="slider-row">
            <label>Sleep Threshold</label>
            <input type="range" id="sleepThreshold" min="0.05" max="1.0" step="0.05" value="${this.config.sleepThreshold}">
            <span class="slider-value" id="sleepThreshold-val">${this.config.sleepThreshold.toFixed(2)}</span>
          </div>
          <div class="slider-row">
            <label>Bounciness</label>
            <input type="range" id="bounciness" min="0" max="1.0" step="0.05" value="${this.config.bounciness}">
            <span class="slider-value" id="bounciness-val">${this.config.bounciness.toFixed(2)}</span>
          </div>
        </div>

        <div class="debug-section">
          <div class="checkbox-row">
            <input type="checkbox" id="debugMode" ${this.config.debugMode ? 'checked' : ''}>
            <label for="debugMode">Debug Mode (3 tiles only)</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="showColliders" ${this.config.showColliders ? 'checked' : ''}>
            <label for="showColliders">Show Collision Wireframes</label>
          </div>
        </div>

        <div class="debug-section info-section">
          <div class="info-title">Ball Info</div>
          <div class="info-row"><span>Position:</span><span id="info-pos">-</span></div>
          <div class="info-row"><span>Velocity:</span><span id="info-vel">-</span></div>
          <div class="info-row"><span>Angular Vel:</span><span id="info-angvel">-</span></div>
          <div class="info-row"><span>State:</span><span id="info-state">-</span></div>
        </div>

        <div class="debug-section">
          <button class="debug-btn primary" id="applySettings">Apply Changes</button>
          <button class="debug-btn" id="copySettings">Copy Settings JSON</button>
          <button class="debug-btn secondary" id="resetDefaults">Reset Defaults</button>
        </div>

        <textarea class="json-output" id="jsonOutput" readonly></textarea>
      </div>
    `;

    // Style the panel
    this.injectStyles();

    // Prevent canvas from capturing events on the debug panel
    panel.addEventListener('pointerdown', (e) => e.stopPropagation());
    panel.addEventListener('pointermove', (e) => e.stopPropagation());
    panel.addEventListener('pointerup', (e) => e.stopPropagation());
    panel.addEventListener('wheel', (e) => e.stopPropagation());
    panel.addEventListener('touchstart', (e) => e.stopPropagation());
    panel.addEventListener('touchmove', (e) => e.stopPropagation());
    panel.addEventListener('touchend', (e) => e.stopPropagation());

    // Setup event listeners after DOM is ready
    setTimeout(() => this.setupEventListeners(panel), 0);

    return panel;
  }

  private injectStyles(): void {
    if (document.getElementById('debug-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'debug-panel-styles';
    style.textContent = `
      #debug-panel {
        position: fixed;
        left: 10px;
        bottom: 10px;
        width: 320px;
        background: rgba(30, 30, 40, 0.95);
        border: 1px solid #4a4a5a;
        border-radius: 8px;
        font-family: 'Segoe UI', Tahoma, sans-serif;
        font-size: 12px;
        color: #e0e0e0;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      }

      #debug-panel.visible {
        display: block;
      }

      .debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: rgba(60, 50, 40, 0.8);
        border-bottom: 1px solid #4a4a5a;
        border-radius: 8px 8px 0 0;
      }

      .debug-title {
        color: #c9a227;
        font-weight: bold;
        letter-spacing: 1px;
        font-size: 11px;
      }

      .debug-close {
        background: none;
        border: none;
        color: #888;
        font-size: 18px;
        cursor: pointer;
        padding: 0 4px;
      }

      .debug-close:hover {
        color: #fff;
      }

      .debug-content {
        padding: 12px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .debug-section {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #3a3a4a;
      }

      .debug-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }

      .slider-row {
        display: grid;
        grid-template-columns: 100px 1fr 45px;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .slider-row label {
        color: #aaa;
        font-size: 11px;
      }

      .slider-row input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        height: 8px;
        background: #4a4a5a;
        border-radius: 4px;
        cursor: pointer;
        margin: 0;
      }

      .slider-row input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        background: #c9a227;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #fff;
      }

      .slider-row input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: #c9a227;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #fff;
      }

      .slider-row input[type="range"]::-moz-range-track {
        height: 8px;
        background: #4a4a5a;
        border-radius: 4px;
      }

      .slider-value {
        color: #c9a227;
        text-align: right;
        font-family: monospace;
        font-size: 11px;
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .checkbox-row input[type="checkbox"] {
        width: 14px;
        height: 14px;
        accent-color: #c9a227;
      }

      .checkbox-row label {
        color: #aaa;
        font-size: 11px;
        cursor: pointer;
      }

      .info-section {
        background: rgba(0,0,0,0.2);
        padding: 10px !important;
        border-radius: 4px;
      }

      .info-title {
        color: #c9a227;
        font-weight: bold;
        font-size: 10px;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 11px;
      }

      .info-row span:first-child {
        color: #888;
      }

      .info-row span:last-child {
        color: #e0e0e0;
        font-family: monospace;
      }

      .debug-btn {
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 6px;
        background: rgba(201, 162, 39, 0.2);
        border: 1px solid #c9a227;
        color: #c9a227;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s;
      }

      .debug-btn:hover {
        background: rgba(201, 162, 39, 0.4);
      }

      .debug-btn.primary {
        background: rgba(50, 180, 80, 0.3);
        border-color: #4a4;
        color: #4d4;
        font-weight: bold;
      }

      .debug-btn.primary:hover {
        background: rgba(50, 180, 80, 0.5);
      }

      .debug-btn.secondary {
        background: rgba(100, 100, 100, 0.2);
        border-color: #666;
        color: #999;
      }

      .debug-btn.secondary:hover {
        background: rgba(100, 100, 100, 0.4);
      }

      .json-output {
        width: 100%;
        height: 100px;
        background: rgba(0,0,0,0.3);
        border: 1px solid #3a3a4a;
        border-radius: 4px;
        color: #8a8;
        font-family: monospace;
        font-size: 10px;
        padding: 8px;
        resize: none;
        margin-top: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  private setupEventListeners(panel: HTMLDivElement): void {
    // Close button
    const closeBtn = panel.querySelector('.debug-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Sliders
    const sliderIds = ['ballRadius', 'wallThickness', 'crateDepth', 'crateWidth', 'crateHeight', 'gravity', 'linearDamping', 'angularDamping', 'sleepThreshold', 'bounciness'];
    sliderIds.forEach(id => {
      const slider = panel.querySelector(`#${id}`) as HTMLInputElement;
      const valueSpan = panel.querySelector(`#${id}-val`) as HTMLSpanElement;

      slider?.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        (this.config as any)[id] = value;

        // Format display value
        if (id === 'gravity') {
          valueSpan.textContent = value.toFixed(0);
        } else if (id === 'crateDepth' || id === 'crateWidth' || id === 'crateHeight') {
          valueSpan.textContent = value.toFixed(1);
        } else {
          valueSpan.textContent = value.toFixed(2);
        }

        this.updateJsonOutput();
        this.debouncedApply();
      });
    });

    // Checkboxes - these can apply immediately (cheap operations)
    const debugMode = panel.querySelector('#debugMode') as HTMLInputElement;
    debugMode?.addEventListener('change', () => {
      this.config.debugMode = debugMode.checked;
      this.onConfigChange?.(this.config);
    });

    const showColliders = panel.querySelector('#showColliders') as HTMLInputElement;
    showColliders?.addEventListener('change', () => {
      this.config.showColliders = showColliders.checked;
      this.onConfigChange?.(this.config);
    });

    // Apply button
    const applyBtn = panel.querySelector('#applySettings');
    applyBtn?.addEventListener('click', () => {
      this.onConfigChange?.(this.config);
      (applyBtn as HTMLButtonElement).textContent = 'Applied!';
      setTimeout(() => {
        (applyBtn as HTMLButtonElement).textContent = 'Apply Changes';
      }, 1000);
    });

    // Copy button
    const copyBtn = panel.querySelector('#copySettings');
    copyBtn?.addEventListener('click', () => {
      const json = JSON.stringify(this.config, null, 2);
      navigator.clipboard.writeText(json);
      (copyBtn as HTMLButtonElement).textContent = 'Copied!';
      setTimeout(() => {
        (copyBtn as HTMLButtonElement).textContent = 'Copy Settings JSON';
      }, 1500);
    });

    // Reset button
    const resetBtn = panel.querySelector('#resetDefaults');
    resetBtn?.addEventListener('click', () => {
      this.config = { ...DEFAULT_CONFIG };
      this.updateSliders();
      this.updateJsonOutput();
      this.onConfigChange?.(this.config);
    });

    // Store references
    this.jsonOutput = panel.querySelector('#jsonOutput');

    // Initial JSON output
    this.updateJsonOutput();
  }

  private updateSliders(): void {
    const sliderIds = ['ballRadius', 'wallThickness', 'crateDepth', 'crateWidth', 'gravity', 'linearDamping', 'angularDamping'];
    sliderIds.forEach(id => {
      const slider = this.container.querySelector(`#${id}`) as HTMLInputElement;
      const valueSpan = this.container.querySelector(`#${id}-val`) as HTMLSpanElement;
      const value = (this.config as any)[id];

      if (slider) slider.value = value.toString();
      if (valueSpan) {
        if (id === 'gravity') {
          valueSpan.textContent = value.toFixed(0);
        } else if (id === 'crateDepth' || id === 'crateWidth') {
          valueSpan.textContent = value.toFixed(1);
        } else {
          valueSpan.textContent = value.toFixed(2);
        }
      }
    });

    const showColliders = this.container.querySelector('#showColliders') as HTMLInputElement;
    if (showColliders) showColliders.checked = this.config.showColliders;
  }

  private updateJsonOutput(): void {
    if (this.jsonOutput) {
      this.jsonOutput.value = JSON.stringify(this.config, null, 2);
    }
  }

  private debouncedApply(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.onConfigChange?.(this.config);
      this.debounceTimer = null;
    }, this.DEBOUNCE_MS);
  }

  private setupKeyboardToggle(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        // Don't trigger if typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT' ||
            (e.target as HTMLElement).tagName === 'TEXTAREA') {
          return;
        }
        this.toggle();
      }
    });
  }

  public show(): void {
    this.container.classList.add('visible');
    this.isVisible = true;

    // Auto-enable debug features when panel opens
    this.config.debugMode = true;
    this.config.showColliders = true;
    this.updateCheckboxes();
    this.onConfigChange?.(this.config);
  }

  public hide(): void {
    this.container.classList.remove('visible');
    this.isVisible = false;

    // Auto-disable debug features when panel closes
    this.config.debugMode = false;
    this.config.showColliders = false;
    this.updateCheckboxes();
    this.onConfigChange?.(this.config);
  }

  private updateCheckboxes(): void {
    const debugMode = this.container.querySelector('#debugMode') as HTMLInputElement;
    const showColliders = this.container.querySelector('#showColliders') as HTMLInputElement;
    if (debugMode) debugMode.checked = this.config.debugMode;
    if (showColliders) showColliders.checked = this.config.showColliders;
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public setOnConfigChange(callback: ConfigChangeCallback): void {
    this.onConfigChange = callback;
  }

  public getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  public setConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateSliders();
    this.updateJsonOutput();
  }

  /**
   * Update ball info display
   */
  public updateBallInfo(pos: { x: number; y: number; z: number } | null,
                        vel: number | null,
                        angVel: number | null,
                        isSettled: boolean): void {
    const posEl = this.container.querySelector('#info-pos');
    const velEl = this.container.querySelector('#info-vel');
    const angVelEl = this.container.querySelector('#info-angvel');
    const stateEl = this.container.querySelector('#info-state');

    if (pos && posEl) {
      posEl.textContent = `(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`;
    } else if (posEl) {
      posEl.textContent = '-';
    }

    if (vel !== null && velEl) {
      velEl.textContent = vel.toFixed(3);
    } else if (velEl) {
      velEl.textContent = '-';
    }

    if (angVel !== null && angVelEl) {
      angVelEl.textContent = angVel.toFixed(3);
    } else if (angVelEl) {
      angVelEl.textContent = '-';
    }

    if (stateEl) {
      stateEl.textContent = pos ? (isSettled ? 'Settled' : 'Active') : 'No ball';
    }
  }

  public dispose(): void {
    this.container.remove();
    const styles = document.getElementById('debug-panel-styles');
    styles?.remove();
  }
}
