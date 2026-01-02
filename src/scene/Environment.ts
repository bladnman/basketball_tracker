import * as THREE from 'three';

export class Environment {
  private scene: THREE.Scene;
  private floor: THREE.Mesh;
  private fog: THREE.Fog;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Floor plane
    const floorGeometry = new THREE.PlaneGeometry(200, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.01;
    this.floor.receiveShadow = true;
    scene.add(this.floor);

    // Fog for depth
    this.fog = new THREE.Fog(0x1a1a2e, 10, 40);
    scene.fog = this.fog;
  }

  public dispose(): void {
    this.scene.remove(this.floor);
    this.floor.geometry.dispose();
    (this.floor.material as THREE.Material).dispose();
    this.scene.fog = null;
  }
}
