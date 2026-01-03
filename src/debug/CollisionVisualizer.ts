/**
 * Visualizes collision bodies as wireframes
 * Simplified version - manually tracks what to show
 */

import * as THREE from 'three';

export class CollisionVisualizer {
  private scene: THREE.Scene;
  private ballWireframe: THREE.LineSegments | null = null;
  private crateWireframes: THREE.LineSegments[] = [];
  private isVisible: boolean = false;
  private currentBallRadius: number = 0.65;
  private currentCrateConfig = { width: 2.0, depth: 2.0, height: 2.0, wallThickness: 0.1 };

  // Materials
  private ballMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  private wallMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
  private floorMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Update ball wireframe position (creates if needed)
   */
  public updateBallPosition(x: number, y: number, z: number, isSettled: boolean): void {
    if (!this.ballWireframe) {
      this.createBallWireframe();
    }
    if (this.ballWireframe) {
      this.ballWireframe.position.set(x, y, z);
      this.ballWireframe.visible = this.isVisible;
      (this.ballWireframe.material as THREE.LineBasicMaterial).color.setHex(
        isSettled ? 0x0088ff : 0x00ff00
      );
    }
  }

  /**
   * Hide the ball wireframe
   */
  public hideBall(): void {
    if (this.ballWireframe) {
      this.ballWireframe.visible = false;
    }
  }

  private createBallWireframe(): void {
    if (this.ballWireframe) {
      this.scene.remove(this.ballWireframe);
      this.ballWireframe.geometry.dispose();
    }
    const geometry = new THREE.SphereGeometry(this.currentBallRadius, 16, 12);
    const wireframe = new THREE.WireframeGeometry(geometry);
    this.ballWireframe = new THREE.LineSegments(wireframe, this.ballMaterial.clone());
    this.ballWireframe.visible = this.isVisible;
    this.scene.add(this.ballWireframe);
  }

  /**
   * Update crate wireframes for given positions
   */
  public updateCratePositions(positions: { x: number; z: number }[], floorY: number): void {
    const { width, depth, height } = this.currentCrateConfig;

    // Ensure we have the right number of crate wireframe sets
    while (this.crateWireframes.length < positions.length * 5) {
      this.addCrateWireframeSet();
    }

    // Hide extras
    for (let i = positions.length * 5; i < this.crateWireframes.length; i++) {
      this.crateWireframes[i].visible = false;
    }

    // Update positions
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const baseIdx = i * 5;
      const wallY = floorY + height / 2;

      // Floor
      this.crateWireframes[baseIdx].position.set(pos.x, floorY, pos.z);
      this.crateWireframes[baseIdx].visible = this.isVisible;

      // Front (positive Z)
      this.crateWireframes[baseIdx + 1].position.set(pos.x, wallY, pos.z + depth / 2);
      this.crateWireframes[baseIdx + 1].visible = this.isVisible;

      // Back (negative Z)
      this.crateWireframes[baseIdx + 2].position.set(pos.x, wallY, pos.z - depth / 2);
      this.crateWireframes[baseIdx + 2].visible = this.isVisible;

      // Left (negative X)
      this.crateWireframes[baseIdx + 3].position.set(pos.x - width / 2, wallY, pos.z);
      this.crateWireframes[baseIdx + 3].visible = this.isVisible;

      // Right (positive X)
      this.crateWireframes[baseIdx + 4].position.set(pos.x + width / 2, wallY, pos.z);
      this.crateWireframes[baseIdx + 4].visible = this.isVisible;
    }
  }

  private addCrateWireframeSet(): void {
    const { width, depth, height, wallThickness } = this.currentCrateConfig;

    // Floor
    const floorGeom = new THREE.BoxGeometry(width, wallThickness, depth);
    const floorWire = new THREE.WireframeGeometry(floorGeom);
    const floorLine = new THREE.LineSegments(floorWire, this.floorMaterial.clone());
    this.scene.add(floorLine);
    this.crateWireframes.push(floorLine);

    // Front/back walls
    const fbWallGeom = new THREE.BoxGeometry(width, height, wallThickness);

    const frontLine = new THREE.LineSegments(new THREE.WireframeGeometry(fbWallGeom), this.wallMaterial.clone());
    this.scene.add(frontLine);
    this.crateWireframes.push(frontLine);

    const backLine = new THREE.LineSegments(new THREE.WireframeGeometry(fbWallGeom), this.wallMaterial.clone());
    this.scene.add(backLine);
    this.crateWireframes.push(backLine);

    // Left/right walls
    const lrWallGeom = new THREE.BoxGeometry(wallThickness, height, depth);

    const leftLine = new THREE.LineSegments(new THREE.WireframeGeometry(lrWallGeom), this.wallMaterial.clone());
    this.scene.add(leftLine);
    this.crateWireframes.push(leftLine);

    const rightLine = new THREE.LineSegments(new THREE.WireframeGeometry(lrWallGeom), this.wallMaterial.clone());
    this.scene.add(rightLine);
    this.crateWireframes.push(rightLine);
  }

  /**
   * Show/hide all wireframes
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (this.ballWireframe) {
      this.ballWireframe.visible = visible;
    }
    for (const wf of this.crateWireframes) {
      wf.visible = visible;
    }
  }

  /**
   * Update ball wireframe radius
   */
  public updateBallRadius(radius: number): void {
    this.currentBallRadius = radius;
    if (this.ballWireframe) {
      const pos = this.ballWireframe.position.clone();
      this.createBallWireframe();
      if (this.ballWireframe) {
        this.ballWireframe.position.copy(pos);
      }
    }
  }

  /**
   * Update crate dimensions - rebuilds all crate wireframes
   */
  public updateCrateDimensions(width: number, depth: number, height: number, wallThickness: number): void {
    this.currentCrateConfig = { width, depth, height, wallThickness };

    // Clear existing
    for (const wf of this.crateWireframes) {
      this.scene.remove(wf);
      wf.geometry.dispose();
      (wf.material as THREE.Material).dispose();
    }
    this.crateWireframes = [];
  }

  public dispose(): void {
    if (this.ballWireframe) {
      this.scene.remove(this.ballWireframe);
      this.ballWireframe.geometry.dispose();
      (this.ballWireframe.material as THREE.Material).dispose();
    }
    for (const wf of this.crateWireframes) {
      this.scene.remove(wf);
      wf.geometry.dispose();
      (wf.material as THREE.Material).dispose();
    }
    this.ballMaterial.dispose();
    this.wallMaterial.dispose();
    this.floorMaterial.dispose();
  }
}
