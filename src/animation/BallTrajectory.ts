import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import {
  THROW_DURATION,
  THROW_PEAK_HEIGHT,
  THROW_START_HEIGHT,
  EJECT_DURATION,
  BALL_REST_Y,
} from '../constants';

/**
 * Calculate position along a parabolic arc
 */
function arcPosition(
  t: number,
  start: THREE.Vector3,
  end: THREE.Vector3,
  peakHeight: number
): THREE.Vector3 {
  const x = start.x + (end.x - start.x) * t;
  const z = start.z + (end.z - start.z) * t;

  // Parabolic arc for Y: y = start*(1-t) + end*t + peak*4*t*(1-t)
  const arcFactor = 4 * t * (1 - t);
  const y = start.y * (1 - t) + end.y * t + (peakHeight - Math.min(start.y, end.y)) * arcFactor;

  return new THREE.Vector3(x, y, z);
}

export class BallTrajectory {
  /**
   * Create throw animation: ball arcs from above into the crate
   */
  public static createThrowAnimation(
    ball: THREE.Object3D,
    targetPosition: THREE.Vector3,
    onComplete?: () => void
  ): TWEEN.Tween<{ t: number }> | null {
    // Start position: above the crate with slight random offset
    const startOffset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      THROW_START_HEIGHT,
      (Math.random() - 0.5) * 1
    );
    const startPos = targetPosition.clone().add(startOffset);

    // End position: resting in crate
    const endPos = targetPosition.clone();
    endPos.y = BALL_REST_Y;

    // Initial position (convert world to local space)
    const initialPos = startPos.clone();
    if (ball.parent) {
      ball.parent.worldToLocal(initialPos);
    }
    ball.position.copy(initialPos);
    ball.visible = true;

    const progress = { t: 0 };
    const initialRotation = {
      x: ball.rotation.x,
      z: ball.rotation.z,
    };

    return new TWEEN.Tween(progress)
      .to({ t: 1 }, THROW_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        const pos = arcPosition(progress.t, startPos, endPos, THROW_PEAK_HEIGHT);
        // Convert world position to local space (ball is child of tile)
        if (ball.parent) {
          ball.parent.worldToLocal(pos);
        }
        ball.position.copy(pos);

        // Add rotation during flight
        ball.rotation.x = initialRotation.x + progress.t * Math.PI * 2;
        ball.rotation.z = initialRotation.z + progress.t * Math.PI * 0.5;
      })
      .onComplete(() => {
        // Physics handles settling naturally - no tween animation needed
        onComplete?.();
      });
  }

  /**
   * Create eject animation: ball pops up and out of the crate
   */
  public static createEjectAnimation(
    ball: THREE.Object3D,
    onComplete?: () => void
  ): TWEEN.Tween<{ t: number }> | null {
    const startPos = ball.position.clone();

    // Random ejection direction
    const angle = Math.random() * Math.PI * 2;
    const lateralDistance = 2 + Math.random();

    // Peak position: up and slightly out
    const peakPos = new THREE.Vector3(
      startPos.x + Math.cos(angle) * lateralDistance * 0.5,
      startPos.y + 3,
      startPos.z + Math.sin(angle) * lateralDistance * 0.5
    );

    // End position: falls out of view
    const endPos = new THREE.Vector3(
      startPos.x + Math.cos(angle) * lateralDistance,
      -3,
      startPos.z + Math.sin(angle) * lateralDistance
    );

    const progress = { t: 0 };

    return new TWEEN.Tween(progress)
      .to({ t: 1 }, EJECT_DURATION)
      .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(() => {
        const t = progress.t;

        if (t < 0.4) {
          // Rising phase
          const localT = t / 0.4;
          ball.position.lerpVectors(startPos, peakPos, localT);
        } else {
          // Falling phase
          const localT = (t - 0.4) / 0.6;
          ball.position.lerpVectors(peakPos, endPos, localT);
        }

        // Spin during ejection
        ball.rotation.x -= 0.15;
        ball.rotation.z -= 0.08;
      })
      .onComplete(() => {
        ball.visible = false;
        onComplete?.();
      });
  }
}
