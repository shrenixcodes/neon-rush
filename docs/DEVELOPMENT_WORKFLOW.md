# Development Workflow

## Repository setup

```bash
git clone <repo-url>
cd neon-rush
npm install
```

No environment variables, API keys, or external services are required -
the game has no backend and no third-party integrations.

## Development server

```bash
npm run dev
```

Starts Vite's dev server (default `http://localhost:5173`) with hot module
replacement. React components hot-reload in place; editing a Phaser scene
file generally requires a full page refresh to see the change, since Phaser
scenes aren't designed to be hot-swapped mid-run.

## Available scripts

| Command                | What it does                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                                                                 |
| `npm run build`        | Type-check (`tsc -b`, via the `prebuild` hook) then produce a production build in `dist/` |
| `npm run preview`      | Serve the production build locally, for testing the actual bundled output                 |
| `npm run lint`         | Run `oxlint` over `src/`                                                                  |
| `npm run format`       | Run Prettier, writing changes                                                             |
| `npm run format:check` | Run Prettier in check-only mode (for CI)                                                  |
| `npm run typecheck`    | `tsc -b --noEmit`, without running a build                                                |
| `npm run test`         | Run the Vitest suite once                                                                 |

`npm run build`'s type-check step runs via a `prebuild` npm lifecycle hook
rather than `tsc -b && vite build` directly in the `build` script - on
Windows, npm's configured script shell can be PowerShell, which doesn't
support `&&` as a command separator the way POSIX shells do. `pre*` hooks
run before their matching script regardless of which shell npm uses, so
this keeps `npm run build` working the same way on every platform.

## Implementation workflow used for this project

Each gameplay system was built and manually verified end-to-end (lane
movement, then jump, then slide, then obstacles, then collision, then
coins, then scoring, then difficulty, then combo, then near-miss, and so on
through polish) before moving to the next, rather than writing the whole
game and debugging it as one block at the end. Milestones in order:

1. **Scaffold** - Vite + React + TypeScript + Tailwind + Phaser, base screen
   routing, no gameplay yet.
2. **Core game** - Boot/Preload/Game scenes, the player entity, three-lane
   movement, jump, slide.
3. **Gameplay systems** - obstacles, coins, collision, scoring, difficulty,
   combo, near-miss.
4. **UI shell** - main menu, HUD, pause, game over, how-to-play.
5. **Progression** - characters, unlocks, persistent save data, high score.
6. **Signature features** - the daily challenge and ghost replay.
7. **Polish** - parallax environments, audio, mobile touch controls,
   accessibility.
8. **Performance and validation** - code-splitting, a full manual QA pass
   against the acceptance checklist (see [TESTING.md](TESTING.md)).
9. **Documentation** - everything under `docs/`.

## Git conventions

One commit per completed, independently-working piece of work - a commit
message describes what changed and reads as a short, specific sentence
("Add jump mechanics with gravity and landing detection"), not a status
update ("WIP", "fixes", "more changes"). Every commit on `main` is expected
to type-check and build cleanly; a change that doesn't is fixed before
committing, not after.

## Testing procedure

See [TESTING.md](TESTING.md) for the full breakdown. In short: pure logic
(`DifficultyManager`, `ComboManager`, the save-data migration, the daily
seed) has Vitest unit tests that run with `npm run test`; everything that
depends on an actual rendered canvas, physics step, or real user gesture
(lane switching, jump/slide feel, collision resolution, audio, touch
controls) is verified manually in a real browser, since that's where it
actually has to work.

## Production build

```bash
npm run build
npm run preview
```

`npm run build` writes to `dist/`. The build is code-split: the main bundle
(React, the menu screens, persistence) is separate from the Phaser engine,
which only loads once a run starts - see
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#lazy-loading-phaser-instead-of-bundling-it-eagerly)
and [PERFORMANCE.md](PERFORMANCE.md) for the measured effect.

## Debugging workflow

- **React/UI issues:** browser DevTools, as with any React app.
- **Gameplay/physics issues:** the most useful tool is reading the actual
  values on the live scene. In development, `GameCanvas` exposes the
  running `Phaser.Game` instance on `window.__NEON_RUSH_GAME__` (only when
  `import.meta.env.DEV` is true - it's not present in a production build).
  From a browser console, `window.__NEON_RUSH_GAME__.scene.getScene('Game')`
  gives direct access to the active scene and every system on it
  (`scene.player`, `scene.obstacleSpawner.getActive()`,
  `scene.scoreManager.getScore()`, and so on), which is far faster for
  diagnosing a physics or spawner bug than only watching the rendered
  output.
- **Build-only issues:** `npm run build` followed by `npm run preview`
  reproduces the exact bundle a player would get, including the lazy-loaded
  Phaser chunk - some issues (chunk splitting, asset paths) only show up
  against the real build, not the dev server.
