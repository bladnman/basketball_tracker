import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { BALL_DIAMETER, CRATE_WIDTH, CRATE_DEPTH, CRATE_HEIGHT, BALL_REST_Y } from '../constants';

// Physics constants
const GRAVITY = -12; // Moderate gravity for natural arcs
const BALL_MASS = 0.6;
const BALL_RESTITUTION = 0.5; // More realistic basketball bounce
const BALL_FRICTION = 0.4; // Good grip on surfaces
const BALL_LINEAR_DAMPING = 0.1; // Preserve velocity longer
const BALL_ANGULAR_DAMPING = 0.08; // Preserve spin much longer
const FIXED_TIME_STEP = 1 / 60;
const MAX_SUB_STEPS = 3;

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
      linearDamping: BALL_LINEAR_DAMPING,
      angularDamping: BALL_ANGULAR_DAMPING,
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
   * Create static colliders for a crate (floor + 4 walls)
   */
  public createCrateCollider(tileId: string, worldPosition: THREE.Vector3): CrateCollider {
    // Remove existing collider if any
    if (this.crateColliders.has(tileId)) {
      this.removeCrateCollider(tileId);
    }

    const bodies: CANNON.Body[] = [];
    const wallThickness = 0.1;
    const floorY = BALL_REST_Y - BALL_DIAMETER / 2;
    const wallHeight = CRATE_HEIGHT;

    // Floor
    const floorShape = new CANNON.Box(new CANNON.Vec3(
      CRATE_WIDTH / 2,
      wallThickness / 2,
      CRATE_DEPTH / 2
    ));
    const floorBody = new CANNON.Body({ mass: 0, shape: floorShape });
    floorBody.position.set(worldPosition.x, floorY, worldPosition.z);
    this.world.addBody(floorBody);
    bodies.push(floorBody);

    // Front wall (positive Z)
    const frontBackShape = new CANNON.Box(new CANNON.Vec3(
      CRATE_WIDTH / 2,
      wallHeight / 2,
      wallThickness / 2
    ));
    const frontBody = new CANNON.Body({ mass: 0, shape: frontBackShape });
    frontBody.position.set(
      worldPosition.x,
      floorY + wallHeight / 2,
      worldPosition.z + CRATE_DEPTH / 2
    );
    this.world.addBody(frontBody);
    bodies.push(frontBody);

    // Back wall (negative Z)
    const backBody = new CANNON.Body({ mass: 0, shape: frontBackShape });
    backBody.position.set(
      worldPosition.x,
      floorY + wallHeight / 2,
      worldPosition.z - CRATE_DEPTH / 2
    );
    this.world.addBody(backBody);
    bodies.push(backBody);

    // Left wall (negative X)
    const leftRightShape = new CANNON.Box(new CANNON.Vec3(
      wallThickness / 2,
      wallHeight / 2,
      CRATE_DEPTH / 2
    ));
    const leftBody = new CANNON.Body({ mass: 0, shape: leftRightShape });
    leftBody.position.set(
      worldPosition.x - CRATE_WIDTH / 2,
      floorY + wallHeight / 2,
      worldPosition.z
    );
    this.world.addBody(leftBody);
    bodies.push(leftBody);

    // Right wall (positive X)
    const rightBody = new CANNON.Body({ mass: 0, shape: leftRightShape });
    rightBody.position.set(
      worldPosition.x + CRATE_WIDTH / 2,
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

    const floorY = BALL_REST_Y - BALL_DIAMETER / 2;
    const wallHeight = CRATE_HEIGHT;

    // Update floor
    collider.bodies[0].position.set(worldPosition.x, floorY, worldPosition.z);
    // Update front wall
    collider.bodies[1].position.set(worldPosition.x, floorY + wallHeight / 2, worldPosition.z + CRATE_DEPTH / 2);
    // Update back wall
    collider.bodies[2].position.set(worldPosition.x, floorY + wallHeight / 2, worldPosition.z - CRATE_DEPTH / 2);
    // Update left wall
    collider.bodies[3].position.set(worldPosition.x - CRATE_WIDTH / 2, floorY + wallHeight / 2, worldPosition.z);
    // Update right wall
    collider.bodies[4].position.set(worldPosition.x + CRATE_WIDTH / 2, floorY + wallHeight / 2, worldPosition.z);
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
