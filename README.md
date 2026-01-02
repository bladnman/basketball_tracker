# 3D Habit Tracker

A web-based 3D habit tracker where each day is represented as a crate. Toggle a day "on" to toss a basketball into the crate with a satisfying arc animation. Toggle "off" to eject the ball.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Infinite horizontal scroll** - Navigate through past and future days seamlessly
- **Satisfying animations** - Ball arcs into crates on toggle, pops out on untoggle
- **Persistent state** - Your habit data is saved to localStorage
- **Week/month labels** - Clear time structure with week numbers (W01, W02) and month labels
- **Today highlight** - Current day is distinctly highlighted
- **Dynamic lighting** - Active days glow with warm accent lighting

## Tech Stack

- **Three.js** - 3D rendering
- **TypeScript** - Type safety
- **Vite** - Fast development and build
- **Tween.js** - Smooth animations
- **date-fns** - Date calculations
- **troika-three-text** - 3D text rendering

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/basketball-tracker.git
cd basketball-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run check` | Run all checks (types, lint, format) |

## Project Structure

```
src/
├── main.ts                  # Entry point
├── app.ts                   # Main application orchestrator
├── constants.ts             # Configuration values
├── scene/
│   ├── SceneManager.ts      # Three.js scene, camera, renderer
│   ├── LightingSystem.ts    # Ambient + dynamic lighting
│   └── Environment.ts       # Floor plane, fog
├── assets/
│   ├── AssetLoader.ts       # GLTF model loading
│   └── AssetNormalizer.ts   # Asset scale/position normalization
├── tiles/
│   ├── DayTile.ts           # Single day: crate + ball + label
│   ├── TilePool.ts          # Object pooling for performance
│   ├── TileRow.ts           # Manages visible tiles
│   └── TileLabel.ts         # Text label creation
├── animation/
│   ├── AnimationManager.ts  # Tween coordination
│   └── BallTrajectory.ts    # Arc calculations for throw/eject
├── scroll/
│   └── ScrollController.ts  # Wheel and drag input handling
├── state/
│   ├── HabitStore.ts        # localStorage persistence
│   ├── DateUtils.ts         # Week/month calculations
│   └── types.ts             # TypeScript interfaces
└── interaction/
    └── TileInteraction.ts   # Click detection via raycasting
```

## Usage

- **Scroll** - Use mouse wheel or drag to navigate through days
- **Click a crate** - Toggle the day on (ball lands in crate)
- **Click again** - Toggle off (ball ejects)
- **Today** is highlighted in gold for easy reference

## 3D Assets

The project includes 3D models under `assets/`:
- Basketball model (CC-BY-4.0)
- Milk crate model (CC-BY-4.0)

Models are sourced from Sketchfab with appropriate attribution.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run checks (`npm run check`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request
