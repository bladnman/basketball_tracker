import { SceneManager } from './scene/SceneManager';
import { LightingSystem } from './scene/LightingSystem';
import { Environment } from './scene/Environment';
import { AssetLoader } from './assets/AssetLoader';
import { AssetNormalizer } from './assets/AssetNormalizer';
import { DayTile } from './tiles/DayTile';
import { TilePool } from './tiles/TilePool';
import { TileRow } from './tiles/TileRow';
import { HabitStore } from './state/HabitStore';
import { ScrollController } from './scroll/ScrollController';
import { TileInteraction } from './interaction/TileInteraction';
import { AnimationManager } from './animation/AnimationManager';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { FRUSTUM_SIZE } from './constants';

export class App {
  private sceneManager: SceneManager;
  private lightingSystem: LightingSystem;
  private environment: Environment;
  private assetLoader: AssetLoader;
  private assetNormalizer: AssetNormalizer;
  private tilePool!: TilePool;
  private tileRow!: TileRow;
  private habitStore: HabitStore;
  private scrollController: ScrollController;
  private tileInteraction!: TileInteraction;
  private animationManager: AnimationManager;
  private physicsWorld: PhysicsWorld;

  constructor(canvas: HTMLCanvasElement) {
    // Core systems
    this.sceneManager = new SceneManager(canvas);
    this.lightingSystem = new LightingSystem(this.sceneManager.scene);
    this.environment = new Environment(this.sceneManager.scene);

    // Asset loading
    this.assetLoader = new AssetLoader();
    this.assetNormalizer = new AssetNormalizer();

    // State
    this.habitStore = new HabitStore();

    // Input
    this.scrollController = new ScrollController(canvas);

    // Animation
    this.animationManager = new AnimationManager();

    // Physics
    this.physicsWorld = new PhysicsWorld();
  }

  public async init(): Promise<void> {
    // Load and normalize assets
    console.log('Loading assets...');
    await this.assetLoader.preload();

    const crateModel = await this.assetLoader.loadCrate();
    const ballModel = await this.assetLoader.loadBall();

    const normalizedCrate = this.assetNormalizer.normalizeCrate(crateModel);
    const normalizedBall = this.assetNormalizer.normalizeBall(ballModel);

    console.log('Assets normalized');

    // Initialize tile templates
    DayTile.setTemplates(normalizedCrate, normalizedBall);

    // Create tile system
    this.tilePool = new TilePool();
    this.tileRow = new TileRow(this.tilePool, this.habitStore, this.lightingSystem, this.physicsWorld);
    this.sceneManager.scene.add(this.tileRow);

    // Calculate viewport width for tile visibility
    const aspect = window.innerWidth / window.innerHeight;
    const viewportWidth = FRUSTUM_SIZE * aspect;

    // Initialize visible tiles
    this.tileRow.initialize(viewportWidth);

    // Setup interaction
    this.tileInteraction = new TileInteraction(
      this.sceneManager.camera,
      this.tileRow,
      this.sceneManager.renderer.domElement
    );

    // Start animation manager
    this.animationManager.start();

    // Setup update loop
    this.sceneManager.onUpdate((delta) => {
      this.update(delta);
    });

    console.log('App initialized');
  }

  private update(delta: number): void {
    // Update scroll
    const scrollOffset = this.scrollController.update();

    // Update tile row based on scroll
    const aspect = window.innerWidth / window.innerHeight;
    const viewportWidth = FRUSTUM_SIZE * aspect;
    this.tileRow.updateScroll(scrollOffset, viewportWidth);

    // Update floor texture to scroll with tiles
    this.environment.updateScroll(scrollOffset);

    // Update physics
    this.physicsWorld.update(delta);

    // Update animations
    this.animationManager.update();
  }

  public start(): void {
    this.sceneManager.start();
    console.log('App started');
  }

  public dispose(): void {
    this.sceneManager.dispose();
    this.lightingSystem.dispose();
    this.environment.dispose();
    this.tileRow.dispose();
    this.scrollController.dispose();
    this.tileInteraction.dispose();
    this.physicsWorld.dispose();
  }
}
