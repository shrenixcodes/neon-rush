# Neon Rush

A cyberpunk endless runner built with React, Phaser, and TypeScript.

Dodge through a neon-lit city at night across three lanes - jump barriers,
slide under lasers, and dodge traffic and drones - while the pace ramps up
the longer you survive. Collect coins to unlock cosmetic characters, chase
a daily seeded challenge, and race a ghost of your own best run.

## Why this project is technically interesting

- **React and Phaser kept strictly separate.** The UI layer never touches
  a Phaser GameObject; the game layer never touches a React component. The
  only connection is a small typed event bus - see
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- **Phaser loads lazily.** The engine (~1.2MB) only downloads once a run
  starts, not on page load - cutting the initial bundle from 1.58MB to
  382KB. See [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) for the measured
  before/after.
- **Nothing is downloaded.** Every visual is drawn procedurally with
  `Phaser.Graphics`, and every sound is synthesized with the Web Audio
  API - there are no image, sprite-sheet, or audio files in this
  repository.
- **Fairness by construction.** Obstacle layouts come from a pre-authored
  pattern library where every pattern guarantees a survivable response,
  rather than a runtime solver checking randomly-generated layouts.
- **A daily challenge and a ghost replay**, both built on a seeded RNG and
  a compact, distance-keyed action log respectively - see
  [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) for exactly what each one is
  (and isn't).

## Tech stack

React 19 · TypeScript · Vite · Phaser 3 · Tailwind CSS v4 · Framer Motion ·
Vitest · localStorage (versioned, with migration)

## Getting started

```bash
npm install
npm run dev
```

Opens the dev server at `http://localhost:5173`. No environment variables
or backend services are required.

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the dev server                |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Serve the production build locally  |
| `npm run test`    | Run the Vitest suite                |
| `npm run lint`    | Run oxlint                          |
| `npm run format`  | Run Prettier                        |

## Controls

| Action            | Keyboard          | Touch              |
| ----------------- | ----------------- | ------------------ |
| Move left / right | A/D or arrow keys | Swipe left / right |
| Jump              | Space, W, or Up   | Swipe up           |
| Slide             | S or Down         | Swipe down         |
| Pause             | Esc               | Pause button       |

On-screen touch buttons also appear automatically on coarse-pointer
(touch) devices.

## Project structure

```
src/
  components/      React screens: menu, HUD, pause, game over, settings, ...
  game/
    scenes/        Phaser scenes (Boot, Preload, Game)
    entities/      Player, Obstacle, Coin, GhostRunner
    systems/       Spawners, collision, difficulty, score, combo, audio, ...
    data/          Characters, obstacle patterns, difficulty curve, environments
  hooks/           React hooks bridging EventBus and localStorage
  services/        Versioned save-data storage
docs/              Architecture, design, and learning documentation
```

## Documentation

Full architecture, gameplay systems, design rationale, technical
trade-offs, workflow, testing, performance, and a six-level learning guide
live in [`docs/`](docs/README.md).

## Testing

```bash
npm run test
```

Pure logic (difficulty curve, combo math, the daily seed, save-data
migration) has unit test coverage; gameplay feel, collision, and input are
verified manually - see [`docs/TESTING.md`](docs/TESTING.md) for the full
breakdown and why it's split that way.

## Future improvements

- A real audio mix (the current soundtrack and sound effects are
  synthesized oscillator tones, not a produced score).
- Additional city environments and obstacle types.
- An actual online leaderboard for the daily challenge (today it's a
  local, per-browser best - see
  [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)).
