import * as THREE from 'three';
import { CRATE_WIDTH, BALL_DIAMETER } from '../constants';

export class AssetNormalizer {
  /**
   * Normalize crate model:
   * - Scale to target width
   * - Center horizontally
   * - Place base at Y=0
   */
  public normalizeCrate(model: THREE.Group): THREE.Group {
    // Compute bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Scale to target width
    const scaleFactor = CRATE_WIDTH / size.x;
    model.scale.setScalar(scaleFactor);

    // Recalculate bounds after scaling
    box.setFromObject(model);
    box.getCenter(center);

    // Center horizontally and position base at Y=0
    model.position.x = -center.x;
    model.position.z = -center.z;
    model.position.y = -box.min.y;

    // Enable shadows
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return model;
  }

  /**
   * Normalize ball model:
   * - Scale to target diameter
   * - Center at origin
   */
  public normalizeBall(model: THREE.Group): THREE.Group {
    // Compute bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Get max dimension (should be roughly spherical)
    const currentDiameter = Math.max(size.x, size.y, size.z);

    // Scale to target diameter
    const scaleFactor = BALL_DIAMETER / currentDiameter;
    model.scale.setScalar(scaleFactor);

    // Recalculate center after scaling
    box.setFromObject(model);
    box.getCenter(center);

    // Center at origin
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;

    // Enable shadows
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });

    return model;
  }

  /**
   * Get the dimensions of a normalized crate for positioning calculations
   */
  public getCrateDimensions(model: THREE.Group): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(model);
    return box.getSize(new THREE.Vector3());
  }
}
