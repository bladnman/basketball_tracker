// Tile layout
export const TILE_SPACING = 3.0;
export const WEEK_GAP = 1.5;

// Asset dimensions (normalized)
export const CRATE_WIDTH = 2.0;
export const CRATE_HEIGHT = 1.5;
export const CRATE_DEPTH = 1.5;
export const BALL_DIAMETER = 1.4;
export const BALL_REST_Y = 0.4;

// Animation timing
export const THROW_DURATION = 500;
export const THROW_PEAK_HEIGHT = 4.0;
export const THROW_START_HEIGHT = 6.0;
export const EJECT_DURATION = 600;
export const SETTLE_DURATION = 200;

// Scroll behavior
export const SCROLL_FRICTION = 0.92;
export const SCROLL_SENSITIVITY = 0.003;
export const DRAG_SENSITIVITY = 0.03;

// Tile pooling
export const VISIBLE_TILE_BUFFER = 2;
export const POOL_SIZE = 20;

// Camera setup
export const CAMERA_POSITION: [number, number, number] = [0, 6, 12];
export const CAMERA_LOOK_AT: [number, number, number] = [0, 1, 0];
export const FRUSTUM_SIZE = 20;

// Colors
export const BACKGROUND_COLOR = 0x1a1a2e;
export const AMBIENT_LIGHT_COLOR = 0x404050;
export const AMBIENT_LIGHT_INTENSITY = 0.6;
export const DIRECTIONAL_LIGHT_COLOR = 0xffffff;
export const DIRECTIONAL_LIGHT_INTENSITY = 0.8;
export const ACTIVE_LIGHT_COLOR = 0xffaa44;
export const TODAY_HIGHLIGHT_COLOR = 0xffcc00;
export const DAY_LABEL_COLOR = 0xffffff;
export const DAY_LABEL_INACTIVE_COLOR = 0x888888; // Dimmer for inactive tiles
export const WEEK_LABEL_COLOR = 0x888888;
export const MONTH_LABEL_COLOR = 0xaaaaaa;

// Asset paths
export const CRATE_PATH = '/milk_crate/scene.gltf';
export const BALL_PATH = '/basketball/scene.gltf';
