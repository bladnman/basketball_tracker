import { SCROLL_FRICTION, SCROLL_SENSITIVITY, DRAG_SENSITIVITY } from '../constants';

// Zoom constants
const ZOOM_SENSITIVITY = 0.002;
const MIN_FRUSTUM = 10;
const MAX_FRUSTUM = 40;

export type ZoomCallback = (frustumSize: number) => void;

export class ScrollController {
  private velocity: number = 0;
  private offset: number = 0;
  private isDragging: boolean = false;
  private lastPointerX: number = 0;
  private frustumSize: number = 20; // Default from constants

  private element: HTMLElement;
  private onZoomCallback: ZoomCallback | null = null;

  constructor(element: HTMLElement, initialFrustum: number = 20) {
    this.element = element;
    this.frustumSize = initialFrustum;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Wheel events
    this.element.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    // Pointer events for drag
    this.element.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.element.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.element.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.element.addEventListener('pointerleave', this.onPointerUp.bind(this));

    // Touch events for mobile
    this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    if (event.shiftKey) {
      // Shift + scroll = horizontal pan (old behavior)
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      this.velocity += delta * SCROLL_SENSITIVITY;
    } else {
      // Scroll = zoom
      const delta = event.deltaY;
      this.frustumSize = Math.max(
        MIN_FRUSTUM,
        Math.min(MAX_FRUSTUM, this.frustumSize + delta * ZOOM_SENSITIVITY)
      );
      this.onZoomCallback?.(this.frustumSize);
    }
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return; // Left click only
    this.isDragging = true;
    this.lastPointerX = event.clientX;
    this.velocity = 0;
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;

    const deltaX = this.lastPointerX - event.clientX;
    this.offset += deltaX * DRAG_SENSITIVITY;
    this.lastPointerX = event.clientX;
  }

  private onPointerUp(): void {
    this.isDragging = false;
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    this.isDragging = true;
    this.lastPointerX = event.touches[0].clientX;
    this.velocity = 0;
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    event.preventDefault();

    const deltaX = this.lastPointerX - event.touches[0].clientX;
    this.offset += deltaX * DRAG_SENSITIVITY;
    this.lastPointerX = event.touches[0].clientX;
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  /**
   * Update scroll state (call every frame)
   */
  public update(): number {
    // Apply velocity to offset
    this.offset += this.velocity;

    // Apply friction (only when not dragging)
    if (!this.isDragging) {
      this.velocity *= SCROLL_FRICTION;

      // Stop when velocity is negligible
      if (Math.abs(this.velocity) < 0.01) {
        this.velocity = 0;
      }
    }

    return this.offset;
  }

  /**
   * Get current scroll offset
   */
  public getOffset(): number {
    return this.offset;
  }

  /**
   * Check if currently scrolling
   */
  public isScrolling(): boolean {
    return this.isDragging || Math.abs(this.velocity) > 0.01;
  }

  /**
   * Set callback for zoom changes
   */
  public setOnZoom(callback: ZoomCallback): void {
    this.onZoomCallback = callback;
  }

  /**
   * Get current frustum size
   */
  public getFrustumSize(): number {
    return this.frustumSize;
  }

  /**
   * Set frustum size directly
   */
  public setFrustumSize(size: number): void {
    this.frustumSize = Math.max(MIN_FRUSTUM, Math.min(MAX_FRUSTUM, size));
    this.onZoomCallback?.(this.frustumSize);
  }

  public dispose(): void {
    this.element.removeEventListener('wheel', this.onWheel.bind(this));
    this.element.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    this.element.removeEventListener('pointermove', this.onPointerMove.bind(this));
    this.element.removeEventListener('pointerup', this.onPointerUp.bind(this));
    this.element.removeEventListener('pointerleave', this.onPointerUp.bind(this));
  }
}
