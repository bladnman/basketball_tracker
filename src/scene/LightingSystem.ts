import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import {
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_COLOR,
  DIRECTIONAL_LIGHT_INTENSITY,
  ACTIVE_LIGHT_COLOR,
} from '../constants';

export class LightingSystem {
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private activeLights: Map<string, THREE.PointLight> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Ambient light - always readable
    this.ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
    scene.add(this.ambientLight);

    // Directional light - subtle shadows
    this.directionalLight = new THREE.DirectionalLight(
      DIRECTIONAL_LIGHT_COLOR,
      DIRECTIONAL_LIGHT_INTENSITY
    );
    this.directionalLight.position.set(8, 12, 8);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    this.directionalLight.shadow.radius = 2; // Soft shadow edges
    scene.add(this.directionalLight);
  }

  public addActiveLight(tileId: string, position: THREE.Vector3): void {
    if (this.activeLights.has(tileId)) return;

    const light = new THREE.PointLight(ACTIVE_LIGHT_COLOR, 0, 7); // Increased distance for softer falloff
    light.position.copy(position);
    light.position.y += 2;
    this.scene.add(light);
    this.activeLights.set(tileId, light);

    // Animate light intensity in (reduced for subtlety)
    new TWEEN.Tween(light).to({ intensity: 1.0 }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
  }

  public removeActiveLight(tileId: string): void {
    const light = this.activeLights.get(tileId);
    if (!light) return;

    new TWEEN.Tween(light)
      .to({ intensity: 0 }, 200)
      .easing(TWEEN.Easing.Quadratic.In)
      .onComplete(() => {
        this.scene.remove(light);
        light.dispose();
      })
      .start();

    this.activeLights.delete(tileId);
  }

  public updateLightPosition(tileId: string, position: THREE.Vector3): void {
    const light = this.activeLights.get(tileId);
    if (light) {
      light.position.copy(position);
      light.position.y += 2;
    }
  }

  public dispose(): void {
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.directionalLight);

    for (const light of this.activeLights.values()) {
      this.scene.remove(light);
      light.dispose();
    }
    this.activeLights.clear();
  }
}
