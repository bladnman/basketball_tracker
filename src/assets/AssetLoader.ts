import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { CRATE_PATH, BALL_PATH } from '../constants';

export class AssetLoader {
  private loader: GLTFLoader;
  private cache: Map<string, GLTF> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
  }

  private async load(path: string): Promise<GLTF> {
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          this.cache.set(path, gltf);
          resolve(gltf);
        },
        undefined,
        reject
      );
    });
  }

  public async loadCrate(): Promise<THREE.Group> {
    const gltf = await this.load(CRATE_PATH);
    return gltf.scene.clone();
  }

  public async loadBall(): Promise<THREE.Group> {
    const gltf = await this.load(BALL_PATH);
    return gltf.scene.clone();
  }

  public async preload(): Promise<void> {
    await Promise.all([this.load(CRATE_PATH), this.load(BALL_PATH)]);
  }
}
