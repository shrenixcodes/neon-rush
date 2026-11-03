# Performance

## Game loop and frame-rate independence

Every system that advances over time scales its own movement by `delta`
(milliseconds since the last frame), not by a fixed per-frame constant -
see [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#delta-time-driven-movement-not-frame-counting)
for why. In practice this means `GameScene.update(time, delta)` is the only
place a frame's elapsed time is read, and it's threaded down into the
player, both spawners, and the parallax background explicitly rather than
any of them assuming a fixed timestep.

## Object pooling

`ObstacleSpawner` and `CoinSpawner` each allocate their full working set
(18 obstacles, 24 coins) once, at scene creation, and never call `new
Obstacle(...)` or `new Coin(...)` again during a run - spawning reuses a
pool member via `acquire()`/`spawn()`, despawning returns it via
`deactivate()`. This bounds the memory and garbage-collection cost of an
endless run that could, in principle, last indefinitely: allocation is
capped at scene-start regardless of how long the player survives.

## Texture management

Every texture (road, six obstacle types, the coin, eight skyline variants -
four environments × far/near) is generated once in
[`PreloadScene`](../src/game/scenes/PreloadScene.ts) via
`Graphics.generateTexture()` and reused for the rest of the run. Nothing is
regenerated per-frame or per-spawn; `Obstacle.spawn()` and `Coin.spawn()`
only call `setTexture()` to pick an existing texture, never draw new
Graphics.

## Collision detection cost

Collision is a manual `this.physics.overlap()` check per active
obstacle/coin, once per frame - see
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#manual-overlap-checks-instead-of-persistent-arcade-colliders)
for why this is appropriate at this game's actual entity counts (comfortably
under 50 active bodies at once, never a Group-scale collision problem).

## Particle and effect management

There is no particle system in this project - "juice" effects (the
near-miss slow-motion dip, game-over camera shake) are implemented as
direct `timeScale` changes and Phaser's built-in `cameras.main.shake()`,
not emitted particles, which keeps their cost fixed and small regardless of
how often they trigger.

## Memory cleanup

- `InputManager.destroy()` removes every keyboard and pointer listener it
  registered; it's called from `GameScene`'s `SHUTDOWN` event handler, so a
  restart or scene teardown never leaves stale listeners attached.
- `GameScene.create()` registers five `EventBus` listeners (pause, resume,
  restart, and the four touch-command events) and explicitly unregisters
  all five in the same `SHUTDOWN` handler.
- `GhostRunner.destroy()` destroys its internal `Player` instance when a
  run ends.
- Pooled obstacles/coins are never destroyed - they're reused for the
  lifetime of the scene, which is itself the intended behavior (see Object
  pooling above).

## Code-splitting: measured before/after

This was the single largest concrete performance change in the project.
Initially, `EventBus` extended `Phaser.Events.EventEmitter`, which meant
`import Phaser from 'phaser'` was reachable from code that React renders
immediately (the HUD, pause screen, touch controls, and `App.tsx`'s
game-over listener all import `EventBus`). Even though `GameCanvas.tsx`
already used a dynamic `import('@/game/PhaserGame')`, the bundler correctly
determined that Phaser was _also_ needed eagerly through that other path,
and included the entire engine in the main chunk anyway.

|                           | Before                               | After                                     |
| ------------------------- | ------------------------------------ | ----------------------------------------- |
| Main chunk (`index-*.js`) | 1,576.55 kB (438.92 kB gzip)         | **381.76 kB (120.11 kB gzip)**            |
| Phaser chunk              | _(not separate - bundled into main)_ | 1,220.24 kB (325.93 kB gzip), lazy-loaded |

The fix was replacing `EventBus`'s Phaser-derived `EventEmitter` with a
~30-line hand-rolled one with no external dependency (see
[`EventBus.ts`](../src/game/EventBus.ts) and
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#eventbus-has-no-phaser-dependency)).
Verified by inspecting `npm run build`'s output chunk list directly, and by
confirming via the network panel against `npm run preview` that
`PhaserGame-*.js` is only requested after pressing Play, never on initial
page load.

## Browser performance considerations

- `canvas { touch-action: none; }` (see [`index.css`](../src/index.css))
  prevents the browser's own touch-scroll/zoom gestures from competing with
  swipe input on the game canvas.
- `prefers-reduced-motion: reduce` is respected in two independent places:
  a global CSS rule flattens all CSS transition/animation durations, and
  Framer Motion's `<MotionConfig reducedMotion="user">` (wrapping the whole
  app in `App.tsx`) disables transform-based entrance animations for every
  `motion.*` component. The near-miss slow-motion dip and the game-over
  camera shake check the same media query directly and skip themselves
  entirely under reduced motion, rather than just running faster.

## Mobile/low-end optimization: the quality setting

Settings exposes a "Visual Quality" toggle (`high`/`low`) that is read once
at scene creation and genuinely changes what gets rendered, not just a
cosmetic label:

- **Low** hides the far (slowest, dimmest) parallax skyline layer on both
  sides, halving the skyline's draw calls.
- **Low** hides the player's ambient glow aura (one fewer translucent
  circle redrawn every frame), for both the live player and the ghost
  runner's player instance.
- **Low** skips the near-miss slow-motion dip and the game-over camera
  shake outright (the near-miss score bonus still applies either way).

See [`GameScene.create()`](../src/game/scenes/GameScene.ts) for where the
setting is read and threaded into `Player`, `ParallaxBackground`, and
`NearMissSystem`.

## What wasn't measured

Actual in-browser frame-rate numbers (e.g. "60fps on device X") are not
reported here, because they weren't measured against real hardware during
this project's development - only the concrete, reproducible bundle-size
numbers above were. Reporting an invented FPS figure would be worse than
reporting nothing.
