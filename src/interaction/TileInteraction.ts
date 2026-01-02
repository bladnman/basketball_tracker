import * as THREE from 'three';
import { TileRow } from '../tiles/TileRow';

export class TileInteraction {
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private camera: THREE.Camera;
  private tileRow: TileRow;
  private element: HTMLElement;

  private pointerDownPosition: THREE.Vector2 = new THREE.Vector2();
  private isClick: boolean = false;
  private clickThreshold: number = 5; // pixels

  constructor(camera: THREE.Camera, tileRow: TileRow, element: HTMLElement) {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.camera = camera;
    this.tileRow = tileRow;
    this.element = element;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.element.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  private onPointerDown(event: PointerEvent): void {
    this.pointerDownPosition.set(event.clientX, event.clientY);
    this.isClick = true;
  }

  private onPointerUp(event: PointerEvent): void {
    // Check if this was a click (not a drag)
    const distance = Math.sqrt(
      Math.pow(event.clientX - this.pointerDownPosition.x, 2) +
        Math.pow(event.clientY - this.pointerDownPosition.y, 2)
    );

    if (distance < this.clickThreshold && this.isClick) {
      this.handleClick(event);
    }

    this.isClick = false;
  }

  private handleClick(event: PointerEvent): void {
    // Convert to normalized device coordinates
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const crateMeshes = this.tileRow.getCrateMeshes();
    const intersects = this.raycaster.intersectObjects(crateMeshes, true);

    if (intersects.length > 0) {
      const tile = this.tileRow.getTileFromMesh(intersects[0].object);
      if (tile && tile.dateKey) {
        this.tileRow.toggleTile(tile.dateKey);
      }
    }
  }

  public dispose(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    this.element.removeEventListener('pointerup', this.onPointerUp.bind(this));
  }
}
