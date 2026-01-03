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
import { DebugPanel, CollisionVisualizer, LightDebugPanel } from './debug';
import { ScoreboardUI } from './ui/ScoreboardUI';
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
  private debugPanel: DebugPanel;
  private lightDebugPanel: LightDebugPanel;
  private collisionVisualizer!: CollisionVisualizer;
  private scoreboardUI: ScoreboardUI;

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

    // Input (with initial frustum size)
    this.scrollController = new ScrollController(canvas, FRUSTUM_SIZE);

    // Wire up zoom to scene manager
    this.scrollController.setOnZoom((frustumSize) => {
      this.sceneManager.setFrustumSize(frustumSize);
    });

    // Animation
    this.animationManager = new AnimationManager();

    // Physics
    this.physicsWorld = new PhysicsWorld();

    // Debug panels (hidden by default, press D to toggle)
    this.debugPanel = new DebugPanel();
    this.lightDebugPanel = new LightDebugPanel();

    // Scoreboard UI
    this.scoreboardUI = new ScoreboardUI();
    this.updateScoreboard();

    // Update scoreboard when habits change
    this.habitStore.subscribe(() => {
      this.updateScoreboard();
    });
    let lastConfig = this.debugPanel.getConfig();

    // Wire light debug panel to lighting system
    this.lightDebugPanel.setOnConfigChange((lightConfig) => {
      this.lightingSystem.setConfig(lightConfig);
    });

    // Wire font change to tile row
    this.lightDebugPanel.setOnFontChange(() => {
      this.tileRow?.refreshFonts();
    });

    this.debugPanel.setOnConfigChange((config) => {
      // Sync light debug panel visibility with physics debug panel
      if (config.debugMode) {
        this.lightDebugPanel.show();
      } else {
        this.lightDebugPanel.hide();
      }
      // Update debug mode on tile row (this is cheap, do it immediately)
      this.tileRow?.setDebugMode(config.debugMode);

      // Update physics world with new config
      this.physicsWorld.setConfig({
        ballRadius: config.ballRadius,
        wallThickness: config.wallThickness,
        crateDepth: config.crateDepth,
        crateWidth: config.crateWidth,
        crateHeight: config.crateHeight,
        gravity: config.gravity,
        linearDamping: config.linearDamping,
        angularDamping: config.angularDamping,
        sleepThreshold: config.sleepThreshold,
        bounciness: config.bounciness,
      });

      // Update collision visualizer visibility
      this.collisionVisualizer?.setVisible(config.showColliders);

      // Only update visualizer dimensions if they actually changed
      if (this.collisionVisualizer) {
        if (config.ballRadius !== lastConfig.ballRadius) {
          this.collisionVisualizer.updateBallRadius(config.ballRadius);
        }
        if (config.crateWidth !== lastConfig.crateWidth ||
            config.crateDepth !== lastConfig.crateDepth ||
            config.crateHeight !== lastConfig.crateHeight ||
            config.wallThickness !== lastConfig.wallThickness) {
          this.collisionVisualizer.updateCrateDimensions(
            config.crateWidth,
            config.crateDepth,
            config.crateHeight,
            config.wallThickness
          );
        }
      }

      lastConfig = { ...config };
    });
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
    this.tileRow.setDebugMode(this.debugPanel.getConfig().debugMode); // Apply initial debug mode
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

    // Create collision visualizer
    this.collisionVisualizer = new CollisionVisualizer(this.sceneManager.scene);

    // Setup update loop
    this.sceneManager.onUpdate((delta) => {
      this.update(delta);
    });

    console.log('App initialized');
    console.log('Press D to toggle debug panel');
  }

  private update(delta: number): void {
    // Update scroll
    const scrollOffset = this.scrollController.update();

    // Update tile row based on scroll (use current frustum size for zoom)
    const aspect = window.innerWidth / window.innerHeight;
    const currentFrustum = this.sceneManager.getFrustumSize();
    const viewportWidth = currentFrustum * aspect;
    this.tileRow.updateScroll(scrollOffset, viewportWidth);

    // Update floor texture to scroll with tiles
    this.environment.updateScroll(scrollOffset);

    // Update physics
    this.physicsWorld.update(delta);

    // Update animations
    this.animationManager.update();

    // Update debug info and collision visualizer
    const ballInfo = this.physicsWorld.getActiveBallInfo();
    if (ballInfo) {
      this.debugPanel.updateBallInfo(
        { x: ballInfo.position.x, y: ballInfo.position.y, z: ballInfo.position.z },
        ballInfo.velocity,
        ballInfo.angularVelocity,
        ballInfo.isSettled
      );
      this.collisionVisualizer.updateBallPosition(
        ballInfo.position.x,
        ballInfo.position.y,
        ballInfo.position.z,
        ballInfo.isSettled
      );
    } else {
      this.debugPanel.updateBallInfo(null, null, null, false);
      this.collisionVisualizer.hideBall();
    }

    // Update crate wireframes
    const cratePositions = this.physicsWorld.getCratePositions();
    const posArray: { x: number; z: number }[] = [];
    for (const pos of cratePositions.values()) {
      posArray.push({ x: pos.x, z: pos.z });
    }
    this.collisionVisualizer.updateCratePositions(posArray, this.physicsWorld.getFloorY());
  }

  private updateScoreboard(): void {
    const thisWeek = this.habitStore.getThisWeekCount();
    const streak = this.habitStore.getCurrentStreak();
    const bestStreak = this.habitStore.getBestStreak();
    this.scoreboardUI.update(thisWeek, streak, bestStreak);
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
    this.debugPanel.dispose();
    this.lightDebugPanel.dispose();
    this.collisionVisualizer.dispose();
    this.scoreboardUI.dispose();
  }
}
