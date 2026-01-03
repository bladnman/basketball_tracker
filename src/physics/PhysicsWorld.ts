import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BALL_REST_Y } from '../constants';

// Physics constants (now mutable via config)
const FIXED_TIME_STEP = 1 / 60;
const MAX_SUB_STEPS = 3;

export interface PhysicsConfigValues {
  ballRadius: number;
  wallThickness: number;
  crateDepth: number;
  crateWidth: number;
  crateHeight: number;
  gravity: number;
  linearDamping: number;
  angularDamping: number;
  sleepThreshold: number;
  bounciness: number;
}

// Default values (tuned for good physics)
const DEFAULT_PHYSICS_CONFIG: PhysicsConfigValues = {
  ballRadius: 0.65,
  wallThickness: 0.1,
  crateDepth: 1.9,
  crateWidth: 1.9,
  crateHeight: 2.0,
  gravity: -14,
  linearDamping: 0.1,
  angularDamping: 0.08,
  sleepThreshold: 0.3,
  bounciness: 0.5,
};

const BALL_MASS = 0.6;
const BALL_FRICTION = 0.4;

// Ground level for detecting rolling balls
const GROUND_Y_THRESHOLD = 0.2; // How close to ground to consider "on ground"
const ROLLING_VERTICAL_THRESHOLD = 0.5; // Max vertical velocity to consider "rolling"

export interface PhysicsBall {
  body: CANNON.Body;
  mesh: THREE.Object3D;
  tileId: string;
  isActive: boolean;
}

export interface CrateCollider {
  bodies: CANNON.Body[]; // Floor + 4 walls
  tileId: string;
}

export class PhysicsWorld {
  private world: CANNON.World;
  private balls: Map<string, PhysicsBall> = new Map();
  private crateColliders: Map<string, CrateCollider> = new Map();
  private groundBody: CANNON.Body;
  private lastScrollOffset: number = 0;
  private config: PhysicsConfigValues;
  private contactMaterial: CANNON.ContactMaterial;

  constructor() {
    this.config = { ...DEFAULT_PHYSICS_CONFIG };

    // Create physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, this.config.gravity, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();

    // Default contact material (with configurable bounciness)
    const defaultMaterial = new CANNON.Material('default');
    this.contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
      friction: BALL_FRICTION,
      restitution: this.config.bounciness,
    });
    this.world.addContactMaterial(this.contactMaterial);
    this.world.defaultContactMaterial = this.contactMaterial;

    // Create ground plane (crate floor level)
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({
      mass: 0, // Static
      shape: groundShape,
      material: defaultMaterial,
    });
    // Rotate to be horizontal (Cannon planes face +Y by default)
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.groundBody.position.set(0, BALL_REST_Y - this.config.ballRadius, 0);
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

    const radius = this.config.ballRadius;

    const sphereShape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
      mass: BALL_MASS,
      shape: sphereShape,
      linearDamping: this.config.linearDamping,
      angularDamping: this.config.angularDamping,
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
    const vy = (dy - 0.5 * this.config.gravity * flightTime * flightTime) / flightTime;

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
      12 + Math.random() * 3, // Increased upward velocity for cleaner exit
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

    // Sync Three.js meshes with physics bodies and apply sleep threshold
    const groundY = BALL_REST_Y - this.config.ballRadius;

    for (const ball of this.balls.values()) {
      if (!ball.isActive) continue;

      const speed = ball.body.velocity.length();
      const angSpeed = ball.body.angularVelocity.length();
      const verticalVelocity = Math.abs(ball.body.velocity.y);
      const ballY = ball.body.position.y;

      // Check if ball is settled (barely moving)
      const isSettled = speed < this.config.sleepThreshold && angSpeed < this.config.sleepThreshold * 2;

      // Check if ball is rolling on ground (near ground, low vertical velocity, but may have horizontal velocity)
      const isNearGround = ballY < (groundY + this.config.ballRadius + GROUND_Y_THRESHOLD);
      const isRolling = isNearGround && verticalVelocity < ROLLING_VERTICAL_THRESHOLD;

      // Get crate info for position checks
      const crateCollider = this.crateColliders.get(ball.tileId);
      const crateX = crateCollider?.bodies[0].position.x ?? 0;
      const crateZ = crateCollider?.bodies[0].position.z ?? 0;
      const ballX = ball.body.position.x;
      const ballZ = ball.body.position.z;

      // Calculate if outside crate bounds
      const innerHalfWidth = (this.config.crateWidth / 2) - this.config.wallThickness - this.config.ballRadius * 0.5;
      const innerHalfDepth = (this.config.crateDepth / 2) - this.config.wallThickness - this.config.ballRadius * 0.5;
      const isOutsideX = Math.abs(ballX - crateX) > innerHalfWidth;
      const isOutsideZ = Math.abs(ballZ - crateZ) > innerHalfDepth;
      const isOutsideCrate = isOutsideX || isOutsideZ;

      if (isSettled) {
        // Force stop - zero out velocities
        ball.body.velocity.set(0, 0, 0);
        ball.body.angularVelocity.set(0, 0, 0);

        // Teleport if outside crate
        if (isOutsideCrate && crateCollider) {
          ball.body.position.set(
            crateX + (Math.random() - 0.5) * 0.2,
            BALL_REST_Y,
            crateZ + (Math.random() - 0.5) * 0.2
          );
        }
      } else if (isRolling && isOutsideCrate && crateCollider) {
        // Ball is rolling on ground outside crate - teleport it back sooner
        ball.body.velocity.set(0, 0, 0);
        ball.body.angularVelocity.set(0, 0, 0);
        ball.body.position.set(
          crateX + (Math.random() - 0.5) * 0.2,
          BALL_REST_Y,
          crateZ + (Math.random() - 0.5) * 0.2
        );
      }

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
   * Create static colliders for a crate (floor + 4 walls)
   */
  public createCrateCollider(tileId: string, worldPosition: THREE.Vector3): CrateCollider {
    // Remove existing collider if any
    if (this.crateColliders.has(tileId)) {
      this.removeCrateCollider(tileId);
    }

    const bodies: CANNON.Body[] = [];
    const wallThickness = this.config.wallThickness;
    const floorY = BALL_REST_Y - this.config.ballRadius;
    const wallHeight = this.config.crateHeight;

    // Floor
    const floorShape = new CANNON.Box(new CANNON.Vec3(
      this.config.crateWidth / 2,
      wallThickness / 2,
      this.config.crateDepth / 2
    ));
    const floorBody = new CANNON.Body({ mass: 0, shape: floorShape });
    floorBody.position.set(worldPosition.x, floorY, worldPosition.z);
    this.world.addBody(floorBody);
    bodies.push(floorBody);

    // Front wall (positive Z)
    const frontBackShape = new CANNON.Box(new CANNON.Vec3(
      this.config.crateWidth / 2,
      wallHeight / 2,
      wallThickness / 2
    ));
    const frontBody = new CANNON.Body({ mass: 0, shape: frontBackShape });
    frontBody.position.set(
      worldPosition.x,
      floorY + wallHeight / 2,
      worldPosition.z + this.config.crateDepth / 2
    );
    this.world.addBody(frontBody);
    bodies.push(frontBody);

    // Back wall (negative Z)
    const backBody = new CANNON.Body({ mass: 0, shape: frontBackShape });
    backBody.position.set(
      worldPosition.x,
      floorY + wallHeight / 2,
      worldPosition.z - this.config.crateDepth / 2
    );
    this.world.addBody(backBody);
    bodies.push(backBody);

    // Left wall (negative X)
    const leftRightShape = new CANNON.Box(new CANNON.Vec3(
      wallThickness / 2,
      wallHeight / 2,
      this.config.crateDepth / 2
    ));
    const leftBody = new CANNON.Body({ mass: 0, shape: leftRightShape });
    leftBody.position.set(
      worldPosition.x - this.config.crateWidth / 2,
      floorY + wallHeight / 2,
      worldPosition.z
    );
    this.world.addBody(leftBody);
    bodies.push(leftBody);

    // Right wall (positive X)
    const rightBody = new CANNON.Body({ mass: 0, shape: leftRightShape });
    rightBody.position.set(
      worldPosition.x + this.config.crateWidth / 2,
      floorY + wallHeight / 2,
      worldPosition.z
    );
    this.world.addBody(rightBody);
    bodies.push(rightBody);

    const collider: CrateCollider = { bodies, tileId };
    this.crateColliders.set(tileId, collider);
    return collider;
  }

  /**
   * Remove crate collider
   */
  public removeCrateCollider(tileId: string): void {
    const collider = this.crateColliders.get(tileId);
    if (!collider) return;

    for (const body of collider.bodies) {
      this.world.removeBody(body);
    }
    this.crateColliders.delete(tileId);
  }

  /**
   * Update crate collider position (for scroll sync)
   */
  public updateCrateColliderPosition(tileId: string, worldPosition: THREE.Vector3): void {
    const collider = this.crateColliders.get(tileId);
    if (!collider) return;

    const floorY = BALL_REST_Y - this.config.ballRadius;
    const wallHeight = this.config.crateHeight;

    // Update floor
    collider.bodies[0].position.set(worldPosition.x, floorY, worldPosition.z);
    // Update front wall
    collider.bodies[1].position.set(worldPosition.x, floorY + wallHeight / 2, worldPosition.z + this.config.crateDepth / 2);
    // Update back wall
    collider.bodies[2].position.set(worldPosition.x, floorY + wallHeight / 2, worldPosition.z - this.config.crateDepth / 2);
    // Update left wall
    collider.bodies[3].position.set(worldPosition.x - this.config.crateWidth / 2, floorY + wallHeight / 2, worldPosition.z);
    // Update right wall
    collider.bodies[4].position.set(worldPosition.x + this.config.crateWidth / 2, floorY + wallHeight / 2, worldPosition.z);
  }

  /**
   * Update scroll offset and shift all physics bodies accordingly
   */
  public updateScrollOffset(newScrollOffset: number): void {
    const deltaX = this.lastScrollOffset - newScrollOffset;
    if (Math.abs(deltaX) < 0.0001) return;

    // Update all ball positions
    for (const ball of this.balls.values()) {
      ball.body.position.x += deltaX;
    }

    // Update all crate collider positions
    for (const collider of this.crateColliders.values()) {
      for (const body of collider.bodies) {
        body.position.x += deltaX;
      }
    }

    this.lastScrollOffset = newScrollOffset;
  }

  /**
   * Get current physics configuration
   */
  public getConfig(): PhysicsConfigValues {
    return { ...this.config };
  }

  /**
   * Update physics configuration at runtime
   * Note: This recreates colliders with new dimensions
   */
  public setConfig(newConfig: Partial<PhysicsConfigValues>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Update gravity
    if (newConfig.gravity !== undefined) {
      this.world.gravity.set(0, this.config.gravity, 0);
    }

    // Update bounciness
    if (newConfig.bounciness !== undefined) {
      this.contactMaterial.restitution = this.config.bounciness;
    }

    // Update ball damping for existing balls
    if (newConfig.linearDamping !== undefined || newConfig.angularDamping !== undefined) {
      for (const ball of this.balls.values()) {
        ball.body.linearDamping = this.config.linearDamping;
        ball.body.angularDamping = this.config.angularDamping;
      }
    }

    // If ball radius changed, recreate ball shapes and update ground plane
    if (newConfig.ballRadius !== undefined && newConfig.ballRadius !== oldConfig.ballRadius) {
      // Update ground plane position
      this.groundBody.position.y = BALL_REST_Y - this.config.ballRadius;

      for (const ball of this.balls.values()) {
        // Store current state
        const pos = ball.body.position.clone();
        const vel = ball.body.velocity.clone();
        const angVel = ball.body.angularVelocity.clone();
        const quat = ball.body.quaternion.clone();

        // Remove old shape and add new one
        ball.body.removeShape(ball.body.shapes[0]);
        const newShape = new CANNON.Sphere(this.config.ballRadius);
        ball.body.addShape(newShape);

        // Restore state
        ball.body.position.copy(pos);
        ball.body.velocity.copy(vel);
        ball.body.angularVelocity.copy(angVel);
        ball.body.quaternion.copy(quat);
      }
    }

    // If crate dimensions changed, we need to update all colliders
    // This is expensive, so only do it when needed
    const crateChanged = (
      newConfig.wallThickness !== undefined ||
      newConfig.crateDepth !== undefined ||
      newConfig.crateWidth !== undefined
    );

    if (crateChanged) {
      // Store positions and recreate all colliders
      const colliderPositions = new Map<string, THREE.Vector3>();
      for (const [tileId, collider] of this.crateColliders) {
        colliderPositions.set(tileId, new THREE.Vector3(
          collider.bodies[0].position.x,
          0,
          collider.bodies[0].position.z
        ));
      }

      for (const [tileId, pos] of colliderPositions) {
        this.createCrateCollider(tileId, pos);
      }
    }
  }

  /**
   * Get info about the first active ball (for debug display)
   */
  public getActiveBallInfo(): { position: THREE.Vector3; velocity: number; angularVelocity: number; isSettled: boolean; tileId: string } | null {
    for (const [tileId, ball] of this.balls) {
      if (ball.isActive) {
        return {
          position: new THREE.Vector3(ball.body.position.x, ball.body.position.y, ball.body.position.z),
          velocity: ball.body.velocity.length(),
          angularVelocity: ball.body.angularVelocity.length(),
          isSettled: this.isBallSettled(tileId),
          tileId,
        };
      }
    }
    return null;
  }

  /**
   * Get all active ball positions (for collision visualizer)
   */
  public getActiveBallPositions(): Map<string, { x: number; y: number; z: number; isSettled: boolean }> {
    const result = new Map();
    for (const [tileId, ball] of this.balls) {
      if (ball.isActive) {
        result.set(tileId, {
          x: ball.body.position.x,
          y: ball.body.position.y,
          z: ball.body.position.z,
          isSettled: this.isBallSettled(tileId),
        });
      }
    }
    return result;
  }

  /**
   * Get all crate collider positions (for collision visualizer)
   */
  public getCratePositions(): Map<string, { x: number; y: number; z: number }> {
    const result = new Map();
    for (const [tileId, collider] of this.crateColliders) {
      // Use floor position (bodies[0])
      result.set(tileId, {
        x: collider.bodies[0].position.x,
        y: collider.bodies[0].position.y,
        z: collider.bodies[0].position.z,
      });
    }
    return result;
  }

  /**
   * Get floor Y position for collision visualization
   */
  public getFloorY(): number {
    return BALL_REST_Y - this.config.ballRadius;
  }

  public dispose(): void {
    for (const ball of this.balls.values()) {
      this.world.removeBody(ball.body);
    }
    this.balls.clear();

    for (const collider of this.crateColliders.values()) {
      for (const body of collider.bodies) {
        this.world.removeBody(body);
      }
    }
    this.crateColliders.clear();

    this.world.removeBody(this.groundBody);
  }
}
