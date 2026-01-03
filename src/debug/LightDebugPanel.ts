/**
 * Debug panel for tuning light parameters
 * Shows on right side when D is pressed
 */

import { ActiveLightConfig } from '../scene/LightingSystem';
import { SPORTY_FONTS, setDateFont, getDateFontName } from '../tiles/TileLabel';

export type LightConfigChangeCallback = (config: ActiveLightConfig) => void;
export type FontChangeCallback = (fontUrl: string) => void;

const DEFAULT_CONFIG: ActiveLightConfig = {
  glowIntensity: 1.1,
  glowDistance: 10,
  glowHeight: 1.5,
  spotIntensity: 8,
  spotDistance: 30,
  spotAngle: 0.5,
  spotPenumbra: 0.4,
  spotDecay: 0.8,
  spotHeight: 6,
  spotZOffset: 3.5,
  spotTargetY: -1.5,
};

export class LightDebugPanel {
  private container: HTMLDivElement;
  private config: ActiveLightConfig;
  private onConfigChange: LightConfigChangeCallback | null = null;
  private onFontChange: FontChangeCallback | null = null;
  private isVisible: boolean = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 100;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.container = this.createPanel();
    document.body.appendChild(this.container);
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'light-debug-panel';
    panel.innerHTML = `
      <div class="debug-header">
        <span class="debug-title">LIGHT DEBUG</span>
      </div>
      <div class="debug-content">
        <div class="debug-section">
          <div class="section-title">Glow Light (Warm Highlight)</div>
          <div class="slider-row">
            <label>Intensity</label>
            <input type="range" id="light-glowIntensity" min="0" max="5" step="0.1" value="${this.config.glowIntensity}">
            <span class="slider-value" id="light-glowIntensity-val">${this.config.glowIntensity.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Distance</label>
            <input type="range" id="light-glowDistance" min="2" max="20" step="0.5" value="${this.config.glowDistance}">
            <span class="slider-value" id="light-glowDistance-val">${this.config.glowDistance.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Height</label>
            <input type="range" id="light-glowHeight" min="0" max="5" step="0.1" value="${this.config.glowHeight}">
            <span class="slider-value" id="light-glowHeight-val">${this.config.glowHeight.toFixed(1)}</span>
          </div>
        </div>

        <div class="debug-section">
          <div class="section-title">Spotlight (Number/Date)</div>
          <div class="slider-row">
            <label>Intensity</label>
            <input type="range" id="light-spotIntensity" min="0" max="8" step="0.1" value="${this.config.spotIntensity}">
            <span class="slider-value" id="light-spotIntensity-val">${this.config.spotIntensity.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Distance</label>
            <input type="range" id="light-spotDistance" min="5" max="30" step="1" value="${this.config.spotDistance}">
            <span class="slider-value" id="light-spotDistance-val">${this.config.spotDistance.toFixed(0)}</span>
          </div>
          <div class="slider-row">
            <label>Angle</label>
            <input type="range" id="light-spotAngle" min="0.1" max="1.2" step="0.05" value="${this.config.spotAngle}">
            <span class="slider-value" id="light-spotAngle-val">${(this.config.spotAngle * 180 / Math.PI).toFixed(0)}°</span>
          </div>
          <div class="slider-row">
            <label>Penumbra</label>
            <input type="range" id="light-spotPenumbra" min="0" max="1" step="0.05" value="${this.config.spotPenumbra}">
            <span class="slider-value" id="light-spotPenumbra-val">${this.config.spotPenumbra.toFixed(2)}</span>
          </div>
          <div class="slider-row">
            <label>Decay</label>
            <input type="range" id="light-spotDecay" min="0" max="3" step="0.1" value="${this.config.spotDecay}">
            <span class="slider-value" id="light-spotDecay-val">${this.config.spotDecay.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Height</label>
            <input type="range" id="light-spotHeight" min="2" max="12" step="0.5" value="${this.config.spotHeight}">
            <span class="slider-value" id="light-spotHeight-val">${this.config.spotHeight.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Z Offset</label>
            <input type="range" id="light-spotZOffset" min="0" max="10" step="0.5" value="${this.config.spotZOffset}">
            <span class="slider-value" id="light-spotZOffset-val">${this.config.spotZOffset.toFixed(1)}</span>
          </div>
          <div class="slider-row">
            <label>Target Y</label>
            <input type="range" id="light-spotTargetY" min="-5" max="2" step="0.25" value="${this.config.spotTargetY}">
            <span class="slider-value" id="light-spotTargetY-val">${this.config.spotTargetY.toFixed(2)}</span>
          </div>
        </div>

        <div class="debug-section">
          <div class="section-title">Font</div>
          <div class="select-row">
            <label>Date Font</label>
            <select id="light-fontSelect">
              ${Object.keys(SPORTY_FONTS).map(name =>
                `<option value="${name}" ${name === getDateFontName() ? 'selected' : ''}>${name}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="debug-section">
          <button class="debug-btn" id="light-copySettings">Copy Settings JSON</button>
          <button class="debug-btn secondary" id="light-resetDefaults">Reset Defaults</button>
        </div>
      </div>
    `;

    this.injectStyles();

    // Prevent canvas events
    panel.addEventListener('pointerdown', (e) => e.stopPropagation());
    panel.addEventListener('pointermove', (e) => e.stopPropagation());
    panel.addEventListener('pointerup', (e) => e.stopPropagation());
    panel.addEventListener('wheel', (e) => e.stopPropagation());
    panel.addEventListener('touchstart', (e) => e.stopPropagation());
    panel.addEventListener('touchmove', (e) => e.stopPropagation());
    panel.addEventListener('touchend', (e) => e.stopPropagation());

    setTimeout(() => this.setupEventListeners(panel), 0);

    return panel;
  }

  private injectStyles(): void {
    if (document.getElementById('light-debug-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'light-debug-panel-styles';
    style.textContent = `
      #light-debug-panel {
        position: fixed;
        right: 10px;
        bottom: 10px;
        width: 280px;
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

      #light-debug-panel.visible {
        display: block;
      }

      #light-debug-panel .debug-header {
        padding: 10px 12px;
        background: rgba(60, 40, 50, 0.8);
        border-bottom: 1px solid #4a4a5a;
        border-radius: 8px 8px 0 0;
      }

      #light-debug-panel .debug-title {
        color: #e8a040;
        font-weight: bold;
        letter-spacing: 1px;
        font-size: 11px;
      }

      #light-debug-panel .debug-content {
        padding: 12px;
        max-height: 70vh;
        overflow-y: auto;
      }

      #light-debug-panel .debug-section {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #3a3a4a;
      }

      #light-debug-panel .debug-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }

      #light-debug-panel .section-title {
        color: #e8a040;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
        text-transform: uppercase;
      }

      #light-debug-panel .slider-row {
        display: grid;
        grid-template-columns: 70px 1fr 40px;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      #light-debug-panel .slider-row label {
        color: #aaa;
        font-size: 11px;
      }

      #light-debug-panel .slider-row input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        height: 6px;
        background: #4a4a5a;
        border-radius: 3px;
        cursor: pointer;
      }

      #light-debug-panel .slider-row input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        background: #e8a040;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #fff;
      }

      #light-debug-panel .slider-value {
        color: #e8a040;
        text-align: right;
        font-family: monospace;
        font-size: 10px;
      }

      #light-debug-panel .select-row {
        display: grid;
        grid-template-columns: 70px 1fr;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      #light-debug-panel .select-row label {
        color: #aaa;
        font-size: 11px;
      }

      #light-debug-panel .select-row select {
        width: 100%;
        padding: 6px 8px;
        background: #3a3a4a;
        border: 1px solid #4a4a5a;
        border-radius: 4px;
        color: #e0e0e0;
        font-size: 11px;
        cursor: pointer;
      }

      #light-debug-panel .select-row select:hover {
        border-color: #e8a040;
      }

      #light-debug-panel .debug-btn {
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 6px;
        background: rgba(232, 160, 64, 0.2);
        border: 1px solid #e8a040;
        color: #e8a040;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
      }

      #light-debug-panel .debug-btn:hover {
        background: rgba(232, 160, 64, 0.4);
      }

      #light-debug-panel .debug-btn.secondary {
        background: rgba(100, 100, 100, 0.2);
        border-color: #666;
        color: #999;
      }
    `;
    document.head.appendChild(style);
  }

  private setupEventListeners(panel: HTMLDivElement): void {
    const sliderConfigs: { id: keyof ActiveLightConfig; isAngle?: boolean }[] = [
      { id: 'glowIntensity' },
      { id: 'glowDistance' },
      { id: 'glowHeight' },
      { id: 'spotIntensity' },
      { id: 'spotDistance' },
      { id: 'spotAngle', isAngle: true },
      { id: 'spotPenumbra' },
      { id: 'spotDecay' },
      { id: 'spotHeight' },
      { id: 'spotZOffset' },
      { id: 'spotTargetY' },
    ];

    sliderConfigs.forEach(({ id, isAngle }) => {
      const slider = panel.querySelector(`#light-${id}`) as HTMLInputElement;
      const valueSpan = panel.querySelector(`#light-${id}-val`) as HTMLSpanElement;

      slider?.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        (this.config as any)[id] = value;

        if (isAngle) {
          valueSpan.textContent = `${(value * 180 / Math.PI).toFixed(0)}°`;
        } else if (id === 'spotDistance') {
          valueSpan.textContent = value.toFixed(0);
        } else if (id === 'spotPenumbra' || id === 'spotTargetY') {
          valueSpan.textContent = value.toFixed(2);
        } else {
          valueSpan.textContent = value.toFixed(1);
        }

        this.debouncedApply();
      });
    });

    // Copy button
    const copyBtn = panel.querySelector('#light-copySettings');
    copyBtn?.addEventListener('click', () => {
      const json = JSON.stringify(this.config, null, 2);
      navigator.clipboard.writeText(json);
      (copyBtn as HTMLButtonElement).textContent = 'Copied!';
      setTimeout(() => {
        (copyBtn as HTMLButtonElement).textContent = 'Copy Settings JSON';
      }, 1500);
    });

    // Reset button
    const resetBtn = panel.querySelector('#light-resetDefaults');
    resetBtn?.addEventListener('click', () => {
      this.config = { ...DEFAULT_CONFIG };
      this.updateSliders();
      this.onConfigChange?.(this.config);
    });

    // Font select
    const fontSelect = panel.querySelector('#light-fontSelect') as HTMLSelectElement;
    fontSelect?.addEventListener('change', () => {
      const fontName = fontSelect.value;
      const fontUrl = SPORTY_FONTS[fontName] || '';
      setDateFont(fontUrl);
      this.onFontChange?.(fontUrl);
    });
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

  private updateSliders(): void {
    const sliderConfigs: { id: keyof ActiveLightConfig; isAngle?: boolean }[] = [
      { id: 'glowIntensity' },
      { id: 'glowDistance' },
      { id: 'glowHeight' },
      { id: 'spotIntensity' },
      { id: 'spotDistance' },
      { id: 'spotAngle', isAngle: true },
      { id: 'spotPenumbra' },
      { id: 'spotDecay' },
      { id: 'spotHeight' },
      { id: 'spotZOffset' },
      { id: 'spotTargetY' },
    ];

    sliderConfigs.forEach(({ id, isAngle }) => {
      const slider = this.container.querySelector(`#light-${id}`) as HTMLInputElement;
      const valueSpan = this.container.querySelector(`#light-${id}-val`) as HTMLSpanElement;
      const value = this.config[id];

      if (slider) slider.value = value.toString();
      if (valueSpan) {
        if (isAngle) {
          valueSpan.textContent = `${(value * 180 / Math.PI).toFixed(0)}°`;
        } else if (id === 'spotDistance') {
          valueSpan.textContent = value.toFixed(0);
        } else if (id === 'spotPenumbra' || id === 'spotTargetY') {
          valueSpan.textContent = value.toFixed(2);
        } else {
          valueSpan.textContent = value.toFixed(1);
        }
      }
    });
  }

  public show(): void {
    this.container.classList.add('visible');
    this.isVisible = true;
  }

  public hide(): void {
    this.container.classList.remove('visible');
    this.isVisible = false;
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public setOnConfigChange(callback: LightConfigChangeCallback): void {
    this.onConfigChange = callback;
  }

  public setOnFontChange(callback: FontChangeCallback): void {
    this.onFontChange = callback;
  }

  public getConfig(): ActiveLightConfig {
    return { ...this.config };
  }

  public dispose(): void {
    this.container.remove();
    const styles = document.getElementById('light-debug-panel-styles');
    styles?.remove();
  }
}
