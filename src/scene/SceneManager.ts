import * as THREE from 'three';
import { BACKGROUND_COLOR, CAMERA_POSITION, CAMERA_LOOK_AT, FRUSTUM_SIZE } from '../constants';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public renderer: THREE.WebGLRenderer;

  private animationId: number = 0;
  private updateCallbacks: Set<(delta: number) => void> = new Set();
  private clock: THREE.Clock;
  private currentFrustumSize: number = FRUSTUM_SIZE;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);

    // Orthographic camera for clean tile rendering
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      (-FRUSTUM_SIZE * aspect) / 2,
      (FRUSTUM_SIZE * aspect) / 2,
      FRUSTUM_SIZE / 2,
      -FRUSTUM_SIZE / 2,
      0.1,
      100
    );
    this.camera.position.set(...CAMERA_POSITION);
    this.camera.lookAt(...CAMERA_LOOK_AT);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.clock = new THREE.Clock();

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    const aspect = window.innerWidth / window.innerHeight;

    this.camera.left = (-this.currentFrustumSize * aspect) / 2;
    this.camera.right = (this.currentFrustumSize * aspect) / 2;
    this.camera.top = this.currentFrustumSize / 2;
    this.camera.bottom = -this.currentFrustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Set the frustum size for zoom
   */
  public setFrustumSize(size: number): void {
    this.currentFrustumSize = size;
    this.onResize(); // Reuse resize logic to update camera
  }

  /**
   * Get current frustum size
   */
  public getFrustumSize(): number {
    return this.currentFrustumSize;
  }

  public onUpdate(callback: (delta: number) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  public start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();

      for (const callback of this.updateCallbacks) {
        callback(delta);
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public stop(): void {
    cancelAnimationFrame(this.animationId);
  }

  public dispose(): void {
    this.stop();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}
