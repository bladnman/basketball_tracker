import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import {
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_COLOR,
  DIRECTIONAL_LIGHT_INTENSITY,
  ACTIVE_LIGHT_COLOR,
} from '../constants';

// Light configuration (mutable via debug panel)
export interface ActiveLightConfig {
  // Glow light (warm highlight on crate)
  glowIntensity: number;
  glowDistance: number;
  glowHeight: number;
  // Spotlight (directional, casts on number/date)
  spotIntensity: number;
  spotDistance: number;
  spotAngle: number;
  spotPenumbra: number;
  spotDecay: number;      // How quickly light falls off (higher = sharper circle)
  spotHeight: number;
  spotZOffset: number;
  spotTargetY: number;    // Y position of spotlight target (lower = hits ground more)
}

const DEFAULT_LIGHT_CONFIG: ActiveLightConfig = {
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

interface ActiveLightSet {
  glow: THREE.PointLight;
  spot: THREE.SpotLight;
  target: THREE.Object3D;
}

export class LightingSystem {
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private activeLights: Map<string, ActiveLightSet> = new Map();
  private config: ActiveLightConfig = { ...DEFAULT_LIGHT_CONFIG };

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

    // 1. Create warm glow point light (highlights the crate)
    const glow = new THREE.PointLight(ACTIVE_LIGHT_COLOR, 0, this.config.glowDistance);
    glow.position.copy(position);
    glow.position.y += this.config.glowHeight;
    this.scene.add(glow);

    // 2. Create spotlight angled from camera direction (casts on number/date)
    const spot = new THREE.SpotLight(
      ACTIVE_LIGHT_COLOR,
      0,
      this.config.spotDistance,
      this.config.spotAngle,
      this.config.spotPenumbra,
      this.config.spotDecay
    );
    spot.position.set(
      position.x,
      position.y + this.config.spotHeight,
      position.z + this.config.spotZOffset
    );

    // Create target for spotlight (configurable Y for ground targeting)
    const target = new THREE.Object3D();
    target.position.set(position.x, this.config.spotTargetY, position.z);
    this.scene.add(target);
    spot.target = target;

    // Spotlight shadows
    spot.castShadow = true;
    spot.shadow.mapSize.width = 512;
    spot.shadow.mapSize.height = 512;
    spot.shadow.camera.near = 1;
    spot.shadow.camera.far = 20;
    spot.shadow.radius = 2;
    this.scene.add(spot);

    // Store both lights
    this.activeLights.set(tileId, { glow, spot, target });

    // Animate both lights in
    new TWEEN.Tween(glow).to({ intensity: this.config.glowIntensity }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
    new TWEEN.Tween(spot).to({ intensity: this.config.spotIntensity }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
  }

  public removeActiveLight(tileId: string): void {
    const lightSet = this.activeLights.get(tileId);
    if (!lightSet) return;

    const { glow, spot, target } = lightSet;

    // Animate both lights out
    new TWEEN.Tween(glow)
      .to({ intensity: 0 }, 200)
      .easing(TWEEN.Easing.Quadratic.In)
      .onComplete(() => {
        this.scene.remove(glow);
        glow.dispose();
      })
      .start();

    new TWEEN.Tween(spot)
      .to({ intensity: 0 }, 200)
      .easing(TWEEN.Easing.Quadratic.In)
      .onComplete(() => {
        this.scene.remove(spot);
        spot.dispose();
        this.scene.remove(target);
      })
      .start();

    this.activeLights.delete(tileId);
  }

  public updateLightPosition(tileId: string, position: THREE.Vector3): void {
    const lightSet = this.activeLights.get(tileId);
    if (!lightSet) return;

    const { glow, spot, target } = lightSet;

    // Update glow position
    glow.position.copy(position);
    glow.position.y += this.config.glowHeight;

    // Update spotlight position
    spot.position.set(
      position.x,
      position.y + this.config.spotHeight,
      position.z + this.config.spotZOffset
    );

    // Update target position (use config for Y)
    target.position.set(position.x, this.config.spotTargetY, position.z);
  }

  /**
   * Get current light config
   */
  public getConfig(): ActiveLightConfig {
    return { ...this.config };
  }

  /**
   * Update light config and apply to existing lights
   */
  public setConfig(newConfig: Partial<ActiveLightConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update all existing lights
    for (const lightSet of this.activeLights.values()) {
      const { glow, spot, target } = lightSet;

      // Update glow
      glow.intensity = this.config.glowIntensity;
      glow.distance = this.config.glowDistance;

      // Update spot
      spot.intensity = this.config.spotIntensity;
      spot.distance = this.config.spotDistance;
      spot.angle = this.config.spotAngle;
      spot.penumbra = this.config.spotPenumbra;
      spot.decay = this.config.spotDecay;

      // Update target Y position
      target.position.y = this.config.spotTargetY;
    }
  }

  public dispose(): void {
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.directionalLight);

    for (const lightSet of this.activeLights.values()) {
      this.scene.remove(lightSet.glow);
      this.scene.remove(lightSet.spot);
      this.scene.remove(lightSet.target);
      lightSet.glow.dispose();
      lightSet.spot.dispose();
    }
    this.activeLights.clear();
  }
}
