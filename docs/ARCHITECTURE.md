# Architecture

See also: [system-architecture.md](diagrams/system-architecture.md),
[gameplay-flow.md](diagrams/gameplay-flow.md),
[game-state-machine.md](diagrams/game-state-machine.md),
[collision-flow.md](diagrams/collision-flow.md).

## Overall shape

Neon Rush is a React application with exactly one component that isn't a
React component: the Phaser `Game` instance mounted by
[`GameCanvas.tsx`](../src/components/GameCanvas.tsx). Everything else - menus,
HUD, pause screen, game over screen, settings, character select - is
ordinary React, styled with Tailwind, animated with Framer Motion.

The split is deliberate and strict:

- React never reaches into Phaser's scene graph, physics bodies, or tweens.
- Phaser never renders a DOM element or reads React state directly.
- The only connection between them is [`EventBus`](../src/game/EventBus.ts),
  a small pub/sub channel, plus a one-time handoff through Phaser's
  `game.registry` when a run starts (see
  [`PhaserGame.ts`](../src/game/PhaserGame.ts)).

This means React's render cycle is never touched by gameplay at 60fps -
`GameHUD` subscribes to `score-changed`/`coins-changed`/etc. and updates its
own local state, but nothing about a jump, a lane change, or an obstacle
spawning ever causes `App.tsx` to re-render.

## React and Phaser integration

`GameCanvas.tsx` is the entire integration surface:

```tsx
useEffect(() => {
  import('@/game/PhaserGame').then(({ createPhaserGame }) => {
    const game = createPhaserGame(containerRef.current, initDataRef.current)
    // ...
  })
  return () => game?.destroy(true)
}, [])
```

Two things matter here. First, the import is dynamic - Phaser (roughly
1.2MB minified) is not part of the bundle a player downloads just to see the
main menu; it loads only once they press Play. Second, the effect has an
empty dependency array and captures its initial props in a `ref` - the
Phaser instance is created once per mount and never recreated when React
state changes, which is what keeps it decoupled from React's render cycle.

## Rendering responsibilities

React renders: every full-screen menu, the HUD overlay, the pause overlay,
the game-over overlay, and the touch control buttons on coarse-pointer
devices. All of it is regular DOM, styled with Tailwind utility classes and
a small custom theme (see [`index.css`](../src/index.css)).

Phaser renders: the canvas contents only - the scrolling road and skyline,
the player, obstacles, coins, and the ghost replay. Every visual asset is
generated at runtime with `Phaser.GameObjects.Graphics.generateTexture()` in
[`PreloadScene`](../src/game/scenes/PreloadScene.ts); there are no image,
sprite-sheet, or audio files anywhere in the project (see
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) for why).

## Game loop and scene lifecycle

Three scenes, started in a fixed order by
[`PhaserGame.ts`](../src/game/PhaserGame.ts): `BootScene` → `PreloadScene` →
`GameScene`. Boot does nothing but immediately start Preload; Preload
generates every texture the run will need and then starts the actual game
scene. Both only run once per page load - a restart re-enters at
`GameScene.create()` directly via `this.scene.restart()`, since there's
nothing to regenerate.

`GameScene.update(time, delta)` runs once per rendered frame and is the
entire gameplay loop: advance distance, scroll the background, update the
player and the ghost, re-evaluate difficulty, advance the spawners, check
collisions, check coin pickups, update the combo window, check for a near
miss, and emit the frame's score/distance. See
[collision-flow.md](diagrams/collision-flow.md) for the exact order and
[GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md) for what each step does.

## Entity management

Obstacles and coins are **pooled**, not constructed per spawn. Both
[`ObstacleSpawner`](../src/game/systems/ObstacleSpawner.ts) and
[`CoinSpawner`](../src/game/systems/CoinSpawner.ts) build a fixed-size array
of entities once (`Array.from({ length: N }, () => new Obstacle(scene))`)
and track which ones are currently in play with a `Set`. Spawning calls
`acquire()` (find a pool member not in the active set) and `spawn()`
(reposition, retexture, re-enable); despawning calls `deactivate()` and
removes it from the set. No `new Obstacle(...)` or `new Coin(...)` happens
after scene creation. The player and the ghost runner are not pooled -
there's exactly one of each per run, so pooling would add complexity for no
benefit.

## Input processing

[`InputManager`](../src/game/systems/InputManager.ts) is the single place
raw input becomes an abstract action. It binds every listed key to the same
handler (so Space, Up, and W all call the same `onJump`), and separately
listens for Phaser pointer events to detect a swipe gesture (a drag past a
distance threshold in a dominant direction). Both paths - keyboard and
swipe - call the exact same `InputHandlers` callbacks, so there's only one
implementation of "what a jump does" to keep in sync. The on-screen touch
buttons are a third path, but they go through `EventBus` instead
(`touch-jump`, etc.) since they're React DOM elements, not something
`InputManager`'s Phaser-side listeners can see - see
[`TouchControls.tsx`](../src/components/TouchControls/TouchControls.tsx) and
the `touch-*` handlers in `GameScene.create()`.

## Collision detection

Arcade Physics overlap checks (`this.physics.overlap(a, b)`), called
manually once per frame for the player against every active obstacle and
every active coin - not registered as persistent colliders. This is simpler
to reason about than Phaser's group-based collider API given that the
"active set" of obstacles/coins changes shape every frame as things spawn
and despawn, and at the entity counts this game runs (well under 50 active
bodies at once) a persistent collider would add structure without a
measurable performance benefit. See
[GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md) for the avoidance rule itself.

## Obstacle generation

Obstacles are never placed by pure chance from an arbitrary legal set - they
come from a fixed library of **patterns**
([`data/obstacles.ts`](../src/game/data/obstacles.ts)), each pre-authored so
the player always has a response available: either every occupied lane
shares the same required action, or at least one lane is deliberately left
clear. `ObstacleSpawner` picks a pattern (filtered to the current difficulty
tier), then applies a random lane rotation and an optional left-right mirror
so the same template doesn't always occupy the same physical lanes. This
guarantees fairness by construction rather than needing a runtime solver to
verify a randomly-generated layout is survivable.

## Difficulty management

A pure function, [`getDifficultyAt(distance)`](../src/game/systems/DifficultyManager.ts),
with no internal state - distance in, `{ scrollSpeed, obstacleGap,
patternTier }` out, linearly interpolated between hand-tuned breakpoints in
[`data/difficultyCurve.ts`](../src/game/data/difficultyCurve.ts). Being pure
is what makes it directly unit-testable with Vitest without touching Phaser
at all (see [`DifficultyManager.test.ts`](../src/game/systems/DifficultyManager.test.ts)).

## Score calculation

[`ScoreManager`](../src/game/systems/ScoreManager.ts) is also a dependency-free
class: `score = floor(distancePixels * rate) + bonusPoints`, where
`bonusPoints` accumulates coin value (scaled by the current combo
multiplier) and near-miss bonuses as they happen. Distance and coin count
are tracked separately from the combined score since the HUD and the
game-over screen need to show them independently.

## Persistence

[`services/storage.ts`](../src/services/storage.ts) owns one versioned save
object and a migration function run on load. See
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) for the versioning scheme
and [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md) for what's actually stored.

## Audio architecture

[`AudioManager`](../src/game/systems/AudioManager.ts) is a singleton, shared
by both layers for the same reason `EventBus` is - a menu click sound and a
jump sound need the same `AudioContext` and the same mute/volume state. It
synthesizes every sound with raw oscillators and a noise buffer (no audio
files); see [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) for why, and
[GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md) for the autoplay-unlock mechanics.

## UI-to-game communication

Summarized here since it's the crux of the whole architecture; see
[system-architecture.md](diagrams/system-architecture.md) for the diagram.

| Direction                                 | Carrier                                    | Examples                                                                                                                       |
| ----------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Phaser → React                            | `EventBus.emit`                            | `score-changed`, `coins-changed`, `combo-changed`, `near-miss`, `game-over`                                                    |
| React → Phaser                            | `EventBus.emit`                            | `pause-requested`, `resume-requested`, `restart-requested`, `touch-jump`, `touch-slide`, `touch-move-left`, `touch-move-right` |
| React → Phaser (one-time, at scene start) | `game.registry.set`                        | `highScore`, `characterId`, `mode`, `dailyBest`, `ghostEvents`                                                                 |
| Phaser → React (one-time, at game over)   | `GameOverPayload` on the `game-over` event | `score`, `distance`, `coins`, `mode`, `isNewHighScore`, `isNewDailyBest`, `ghostEvents?`                                       |

`App.tsx` is the only place that writes to `localStorage`; `GameScene` only
ever emits facts about what happened, never persists anything itself.
