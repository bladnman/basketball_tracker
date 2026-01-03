import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BALL_DIAMETER, CRATE_WIDTH, CRATE_DEPTH, BALL_REST_Y } from '../constants';

// Physics constants
const GRAVITY = -15; // Slightly stronger than real gravity for snappier feel
const BALL_MASS = 0.6;
const BALL_RESTITUTION = 0.7; // Bounciness
const BALL_FRICTION = 0.3;
const FIXED_TIME_STEP = 1 / 60;
const MAX_SUB_STEPS = 3;

export interface PhysicsBall {
  body: CANNON.Body;
  mesh: THREE.Object3D;
  tileId: string;
  isActive: boolean;
}

export class PhysicsWorld {
  private world: CANNON.World;
  private balls: Map<string, PhysicsBall> = new Map();
  private groundBody: CANNON.Body;

  constructor() {
    // Create physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, GRAVITY, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();

    // Default contact material
    const defaultMaterial = new CANNON.Material('default');
    const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
      friction: BALL_FRICTION,
      restitution: BALL_RESTITUTION,
    });
    this.world.addContactMaterial(contactMaterial);
    this.world.defaultContactMaterial = contactMaterial;

    // Create ground plane (crate floor level)
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({
      mass: 0, // Static
      shape: groundShape,
      material: defaultMaterial,
    });
    // Rotate to be horizontal (Cannon planes face +Y by default)
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.groundBody.position.set(0, BALL_REST_Y - BALL_DIAMETER / 2, 0);
    this.world.addBody(this.groundBody);
  }

  /**
   * Create a physics body for a ball in a tile
   */
  public createBallBody(tileId: string, mesh: THREE.Object3D, worldPosition: THREE.Vector3): PhysicsBall {
    // Remove existing body if any
    if (this.balls.has(tileId)) {
      this.removeBall(tileId);
    }

    const radius = BALL_DIAMETER / 2;

    const sphereShape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
      mass: BALL_MASS,
      shape: sphereShape,
      linearDamping: 0.1,
      angularDamping: 0.4,
    });

    // Position at world coordinates
    body.position.set(worldPosition.x, worldPosition.y, worldPosition.z);

    this.world.addBody(body);

    const physicsBall: PhysicsBall = {
      body,
      mesh,
      tileId,
      isActive: true,
    };

    this.balls.set(tileId, physicsBall);
    return physicsBall;
  }

  /**
   * Throw a ball with initial velocity
   */
  public throwBall(tileId: string, startPosition: THREE.Vector3, targetPosition: THREE.Vector3): void {
    const ball = this.balls.get(tileId);
    if (!ball) return;

    // Position at start
    ball.body.position.set(startPosition.x, startPosition.y, startPosition.z);
    ball.body.velocity.set(0, 0, 0);
    ball.body.angularVelocity.set(0, 0, 0);

    // Calculate velocity to reach target
    // Using projectile motion: we want the ball to arc and land at target
    const dx = targetPosition.x - startPosition.x;
    const dy = targetPosition.y - startPosition.y;
    const dz = targetPosition.z - startPosition.z;

    // Time of flight (adjust for desired arc)
    const flightTime = 0.5; // seconds

    // Calculate required velocities
    const vx = dx / flightTime;
    const vz = dz / flightTime;
    // vy needs to account for gravity: y = y0 + vy*t + 0.5*g*t^2
    // vy = (dy - 0.5*g*t^2) / t
    const vy = (dy - 0.5 * GRAVITY * flightTime * flightTime) / flightTime;

    ball.body.velocity.set(vx, vy, vz);

    // Add some spin
    ball.body.angularVelocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 10
    );

    ball.isActive = true;
  }

  /**
   * Eject a ball with random velocity
   */
  public ejectBall(tileId: string): void {
    const ball = this.balls.get(tileId);
    if (!ball) return;

    // Random ejection direction
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 2;

    ball.body.velocity.set(
      Math.cos(angle) * speed,
      8 + Math.random() * 3, // Upward
      Math.sin(angle) * speed
    );

    ball.body.angularVelocity.set(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 15
    );

    ball.isActive = true;
  }

  /**
   * Remove a ball from physics simulation
   */
  public removeBall(tileId: string): void {
    const ball = this.balls.get(tileId);
    if (!ball) return;

    this.world.removeBody(ball.body);
    this.balls.delete(tileId);
  }

  /**
   * Check if a ball has settled (stopped moving)
   */
  public isBallSettled(tileId: string): boolean {
    const ball = this.balls.get(tileId);
    if (!ball) return true;

    const speed = ball.body.velocity.length();
    const angularSpeed = ball.body.angularVelocity.length();

    return speed < 0.1 && angularSpeed < 0.1;
  }

  /**
   * Get ball from the map
   */
  public getBall(tileId: string): PhysicsBall | undefined {
    return this.balls.get(tileId);
  }

  /**
   * Step the physics simulation and sync meshes
   */
  public update(delta: number): void {
    // Step physics
    this.world.step(FIXED_TIME_STEP, delta, MAX_SUB_STEPS);

    // Sync Three.js meshes with physics bodies
    for (const ball of this.balls.values()) {
      if (!ball.isActive) continue;

      // Get world position from physics
      const worldPos = new THREE.Vector3(
        ball.body.position.x,
        ball.body.position.y,
        ball.body.position.z
      );

      // Convert to local space if mesh has a parent
      if (ball.mesh.parent) {
        // Update world matrix to ensure accurate conversion
        ball.mesh.parent.updateWorldMatrix(true, false);
        ball.mesh.parent.worldToLocal(worldPos);
      }

      ball.mesh.position.copy(worldPos);

      // Sync rotation
      ball.mesh.quaternion.set(
        ball.body.quaternion.x,
        ball.body.quaternion.y,
        ball.body.quaternion.z,
        ball.body.quaternion.w
      );
    }
  }

  /**
   * Create a static box collider for a crate
   */
  public createCrateCollider(worldPosition: THREE.Vector3): CANNON.Body {
    // Create a box shape for the crate interior
    const halfExtents = new CANNON.Vec3(
      CRATE_WIDTH / 2 - BALL_DIAMETER / 2, // Slightly smaller to keep ball inside
      0.05, // Thin floor
      CRATE_DEPTH / 2 - BALL_DIAMETER / 2
    );

    const shape = new CANNON.Box(halfExtents);
    const body = new CANNON.Body({
      mass: 0, // Static
      shape,
    });

    body.position.set(
      worldPosition.x,
      BALL_REST_Y - BALL_DIAMETER / 2,
      worldPosition.z
    );

    this.world.addBody(body);
    return body;
  }

  public dispose(): void {
    for (const ball of this.balls.values()) {
      this.world.removeBody(ball.body);
    }
    this.balls.clear();
    this.world.removeBody(this.groundBody);
  }
}
