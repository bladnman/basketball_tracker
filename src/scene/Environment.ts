import * as THREE from 'three';

// Floor dimensions and texture tiling
const FLOOR_WIDTH = 200;
const FLOOR_DEPTH = 50;
const TEXTURE_REPEAT_X = 20;
const TEXTURE_REPEAT_Y = 5;

export class Environment {
  private scene: THREE.Scene;
  private floor: THREE.Mesh;
  private fog: THREE.Fog;
  private hemisphereLight: THREE.HemisphereLight;
  private textureLoader: THREE.TextureLoader;
  private floorTexture: THREE.Texture;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();

    // Load wood floor texture
    this.floorTexture = this.textureLoader.load('/assets/floor/wood_floor_worn_diff_4k.jpg');
    this.floorTexture.wrapS = THREE.RepeatWrapping;
    this.floorTexture.wrapT = THREE.RepeatWrapping;
    this.floorTexture.repeat.set(TEXTURE_REPEAT_X, TEXTURE_REPEAT_Y);
    this.floorTexture.colorSpace = THREE.SRGBColorSpace;

    // Floor plane with wood texture
    const floorGeometry = new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_DEPTH);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: this.floorTexture,
      roughness: 0.8,
      metalness: 0.05,
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.01;
    this.floor.receiveShadow = true;
    scene.add(this.floor);

    // Hemisphere light for subtle natural fill
    this.hemisphereLight = new THREE.HemisphereLight(
      0x8888aa, // Sky color (cool blue)
      0x443322, // Ground color (warm wood reflection)
      0.25      // Low intensity for subtlety
    );
    scene.add(this.hemisphereLight);

    // Fog for depth
    this.fog = new THREE.Fog(0x1a1a2e, 10, 40);
    scene.fog = this.fog;
  }

  /**
   * Update floor texture offset based on scroll position
   * Creates endless scrolling floor effect
   */
  public updateScroll(scrollOffset: number): void {
    // Convert world scroll to texture offset
    // Each FLOOR_WIDTH/TEXTURE_REPEAT_X world units = 1 texture repeat
    const worldUnitsPerRepeat = FLOOR_WIDTH / TEXTURE_REPEAT_X;
    const textureOffset = scrollOffset / worldUnitsPerRepeat;

    // Set texture offset to scroll in same direction as tiles
    this.floorTexture.offset.x = textureOffset;
  }

  public dispose(): void {
    this.scene.remove(this.floor);
    this.floor.geometry.dispose();
    (this.floor.material as THREE.Material).dispose();
    this.floorTexture.dispose();
    this.scene.remove(this.hemisphereLight);
    this.scene.fog = null;
  }
}
