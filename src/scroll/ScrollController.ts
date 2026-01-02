import { SCROLL_FRICTION, SCROLL_SENSITIVITY, DRAG_SENSITIVITY } from '../constants';

export class ScrollController {
  private velocity: number = 0;
  private offset: number = 0;
  private isDragging: boolean = false;
  private lastPointerX: number = 0;

  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
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

    // Use deltaX for horizontal scroll, deltaY with shift for vertical scroll wheels
    const delta = event.shiftKey ? event.deltaY : event.deltaX;
    this.velocity += delta * SCROLL_SENSITIVITY;
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

  public dispose(): void {
    this.element.removeEventListener('wheel', this.onWheel.bind(this));
    this.element.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    this.element.removeEventListener('pointermove', this.onPointerMove.bind(this));
    this.element.removeEventListener('pointerup', this.onPointerUp.bind(this));
    this.element.removeEventListener('pointerleave', this.onPointerUp.bind(this));
  }
}
