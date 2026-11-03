# Learning Guide

A progressive path through the engineering concepts this project
demonstrates, using Neon Rush's own code as the worked example for each
one. Each topic follows the same shape: what the concept is, why it
matters, where it's implemented here, a concrete example from the code, a
mistake that's easy to make, and an exercise to try yourself.

---

## Level 1 — Browser Game Foundations

### Canvas rendering and game engines

**Concept:** a browser game needs something to own a render loop and draw
to a `<canvas>` every frame - that's what a game engine like Phaser
provides, instead of hand-rolling `requestAnimationFrame` calls and manual
canvas drawing.

**Why it matters:** without an engine, you'd be reimplementing scene
management, asset loading, input handling, and physics from scratch before
writing a single line of actual gameplay.

**Where:** [`PhaserGame.ts`](../src/game/PhaserGame.ts) creates one
`Phaser.Game` instance; everything else in `src/game/` builds on top of it.

**Example:** `new Phaser.Game({ type: Phaser.AUTO, width: GAME_WIDTH, ... })`

- `Phaser.AUTO` lets Phaser pick WebGL if available, falling back to
  Canvas 2D otherwise, without the game code caring which one is active.

**Common mistake:** creating a second `Phaser.Game` instance (e.g. on a
React re-render) instead of reusing one. `GameCanvas.tsx` avoids this with
an effect that has an empty dependency array and runs exactly once per
mount.

**Exercise:** open the browser console on a running game and inspect
`window.__NEON_RUSH_GAME__.renderer.type` (dev mode only) - compare it on a
device that supports WebGL vs. one that doesn't.

### Phaser scene lifecycle

**Concept:** a Phaser `Scene` has a defined lifecycle -
`init(data)` → `preload()` → `create()` → repeated `update(time, delta)` -
and `scene.start()`/`scene.restart()`/`scene.pause()`/`scene.resume()` move
a scene through it explicitly.

**Why it matters:** understanding which method runs when is the difference
between code that runs once per scene and code that silently runs 60
times a second.

**Where:** [`BootScene`](../src/game/scenes/BootScene.ts) →
[`PreloadScene`](../src/game/scenes/PreloadScene.ts) →
[`GameScene`](../src/game/scenes/GameScene.ts), chained with
`this.scene.start('NextSceneKey')`.

**Example:** `PreloadScene.create()` generates every texture the game
needs exactly once, then calls `this.scene.start('Game')` - if that
texture generation were accidentally placed in `GameScene.update()`
instead, it would regenerate 60 times a second for no reason.

**Common mistake:** assuming `scene.restart()` behaves like creating a
fresh `Phaser.Game`. It doesn't - it only re-runs that one scene's
lifecycle. Data meant to survive a restart (like the player's high score)
has to live somewhere that outlives the scene - this project uses
`game.registry` for exactly that reason.

**Exercise:** add a `console.log` to `GameScene.create()` and trigger a
Restart from the pause menu - confirm it logs again, proving `create()`
re-ran, while a value you stored in `this.registry` survived.

### Game-loop fundamentals

**Concept:** `update(time, delta)` runs once per rendered frame; `delta` is
the number of milliseconds since the previous frame, and is almost never
the same value twice.

**Why it matters:** code that moves something by a fixed amount per frame
runs at different real-world speeds on different displays. Code that
multiplies by `delta` doesn't.

**Where:** every system that moves over time - see
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#delta-time-driven-movement-not-frame-counting).

**Example:** `this.road.tilePositionY -= distanceDelta *
this.physics.world.timeScale` in `GameScene.update()` - note it also
multiplies by `timeScale`, which is how the near-miss slow-motion effect
visually slows the background down too.

**Common mistake:** writing `player.x += 5` instead of `player.x += 5 *
(delta / 16.67)` (or deriving the movement from physics velocity, as this
project does for the jump). The first version looks fine in testing and
then runs oddly fast or slow on a different machine.

**Exercise:** temporarily change a `* delta` multiplication to a flat
constant somewhere non-critical (like the coin spin animation in
[`Coin.ts`](../src/game/entities/Coin.ts)) and watch it desync from frame
rate if you throttle your browser's CPU in DevTools.

### Asset loading

**Concept:** normally this means loading image/audio files in a `preload()`
method before anything needs them.

**Why it matters, and the twist here:** this project has no external
assets to load at all - see
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#procedurally-generated-visuals-no-image-assets).
What `PreloadScene` actually does is _generate_ textures synchronously with
`Graphics.generateTexture()`, which is a different (and in this case,
simpler) problem than asynchronous file loading.

**Where:** every `draw*()` method in
[`PreloadScene.ts`](../src/game/scenes/PreloadScene.ts).

**Example:** `drawBarrier()` draws a few rounded rectangles and lines with
`Graphics`, then calls `g.generateTexture('obstacle-barrier', w, h)` - from
that point on, `'obstacle-barrier'` is a normal texture key any sprite can
use, indistinguishable from one loaded from a PNG.

**Common mistake:** forgetting to call `g.destroy()` after
`generateTexture()` - the `Graphics` object used to draw the texture is
disposable once baked; keeping it around (and, worse, keeping it visible in
the scene) would draw it a second time by accident.

**Exercise:** write a new `drawX()` method that generates a texture for a
shape of your own design, and spawn a sprite using it somewhere in
`GameScene` to see it rendered.

---

## Level 2 — Game Mechanics

### Input processing

**Concept:** translate raw hardware events (keydown, pointerdown/up) into
abstract game actions, so the rest of the game never has to know whether a
jump came from the keyboard, a swipe, or a tap.

**Where:** [`InputManager.ts`](../src/game/systems/InputManager.ts).

**Example:** every key in `KEY_BINDINGS.onJump` (`SPACE`, `UP`, `W`) is
bound to the exact same handler function - there's one implementation of
"what pressing jump does," not three.

**Common mistake:** binding gameplay logic directly inside an input
callback instead of calling through to a method the rest of the game can
also call. This project's swipe detection and its on-screen touch buttons
both end up calling the identical `GameScene.handleJump()` method that the
keyboard binding calls - see the `touch-jump` listener in `GameScene.create()`.

**Exercise:** add a new keybinding (e.g. `Q`) for an existing action and
confirm it works identically to the existing bindings.

### Three-lane movement

See [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md#three-lane-movement) for the
full writeup, including the input-buffering logic.

**Exercise:** change `LANE_SWITCH_MS` in
[`gameConfig.ts`](../src/game/config/gameConfig.ts) to `500` and feel how
much less responsive lane changes become - then try `50` and feel how
teleport-y it gets. The current `150` is a deliberately tuned middle
ground.

### Player state transitions

**Concept:** a small, explicit state machine (`running | jumping | sliding
| dead`) where each action method guards on the current state before doing
anything.

**Where:** [`Player.ts`](../src/game/entities/Player.ts).

**Example:** `jump(): boolean { if (this.state !== 'running') return false
... }` - the boolean return value is itself meaningful: `GameScene` and
`ReplayRecorder` both check it to decide whether to actually record/react
to the jump, since a jump request that didn't take effect (already
airborne) shouldn't be logged as if it happened.

**Common mistake:** letting two states be true at once (e.g. forgetting
to guard `slide()` the same way as `jump()`, so a player could slide while
already jumping). Keep every state-changing method's guard consistent.

**Exercise:** try removing the `if (this.state !== 'running') return
false` guard from `slide()` and see what happens when you slide mid-jump -
then put it back and explain in your own words why the guard matters.

### Jumping and gravity; sliding and hitboxes

See [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md#jump-mechanics) and
[GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md#sliding-mechanics) for the full
writeups - both sections describe a real bug that was found and fixed
during development (gravity leaking into the running state; a hitbox being
unintentionally halved by scale compounding), which are worth reading
specifically because they're the kind of bug that _looks_ correct until you
actually measure the resulting numbers.

**Exercise:** comment out the `this.body.setGravityY(0)` line in `jump()`'s
landing branch and watch the player slowly sink below the road over a long
run - then restore it. This reproduces the exact bug described in
`GAMEPLAY_SYSTEMS.md`.

---

## Level 3 — Gameplay Systems

### Procedural obstacle spawning

See [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md#obstacle-system) and
[GAME_DESIGN.md](GAME_DESIGN.md#why-the-moving-drone-is-still-fair).

**Concept worth isolating:** "randomized" doesn't have to mean "generated
from scratch with runtime validation." Pre-authoring a small library of
guaranteed-fair _patterns_ and randomizing which one (plus a lane rotation)
gets picked is simpler to verify correct and just as varied in play.

**Exercise:** add a new entry to `OBSTACLE_PATTERNS` in
[`data/obstacles.ts`](../src/game/data/obstacles.ts) that blocks two lanes
with different required actions, leaving the third lane clear - confirm
it's survivable, then try one that blocks all three lanes with different
actions and notice why that would be unfair (and why the existing patterns
never do this).

### Collision detection

See [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md) and
[collision-flow.md](diagrams/collision-flow.md).

**Exercise:** in `CollisionSystem.checkObstacleHit`, temporarily remove the
`'jump'` clause from the `avoided` check and try to clear a barrier - note
that jumping no longer helps, confirming that clause is in fact what makes
jumping work as an avoidance method rather than just a visual effect.

### Collectible systems

See [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md#coin-collection).

### Scoring

See [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md#scoring) and
[`ScoreManager.ts`](../src/game/systems/ScoreManager.ts) - a genuinely
dependency-free class, worth reading end-to-end in under a minute as an
example of keeping game-logic classes decoupled from the engine they run
inside.

### Difficulty progression

See [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md#difficulty-scaling).

**Exercise:** `getDifficultyAt` is a pure function - call it directly from
a scratch file or the browser console (`import` it, or just read
`src/game/systems/DifficultyManager.test.ts` for live examples) with a few
different distances and predict the output before running it.

---

## Level 4 — Software Architecture

### Separation of concerns

See [ARCHITECTURE.md](ARCHITECTURE.md) in full - the React/Phaser split is
the headline example in this project, but the same principle repeats inside
the Phaser layer: `GameScene` orchestrates, but doesn't itself know _how_
difficulty is calculated, _how_ a pattern is chosen, or _how_ a coin's spin
animation works - it just calls into `DifficultyManager`, `ObstacleSpawner`,
and `Coin.update()` respectively.

### Component and system responsibilities

**Exercise:** pick any file under `src/game/systems/` and write, in one
sentence, what it owns and what it explicitly does _not_ own. If you find
yourself needing "and" in that sentence, it may be doing too much.

### React and Phaser integration

See [ARCHITECTURE.md](ARCHITECTURE.md#react-and-phaser-integration) and
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#react-for-the-interface-layer-kept-strictly-separate-from-phaser).

### Event-driven communication

**Concept:** instead of two systems holding direct references to each
other, they both talk to a shared bus - a publisher doesn't need to know
who (if anyone) is listening, and a listener doesn't need to know who (if
anyone) will publish.

**Where:** [`EventBus.ts`](../src/game/EventBus.ts), and its full event
contract in [`game/types/events.ts`](../src/game/types/events.ts).

**Example:** `GameHUD` never imports anything from `src/game/scenes/` - it
only calls `EventBus.on('score-changed', setScore)`. `GameScene` never
imports anything from `src/components/` - it only calls
`EventBus.emit('score-changed', ...)`. Neither side could compile a
reference to the other's internals even if it tried.

**Common mistake:** forgetting to unregister a listener, which leaks
memory and can cause a handler to fire for a scene instance that no longer
makes sense. Every `EventBus.on()` call in this project has a matching
`EventBus.off()` in a cleanup path - see the `useEffect` cleanup functions
in [`useGameEvents.ts`](../src/hooks/useGameEvents.ts) and the `SHUTDOWN`
handler in `GameScene.create()`.

**Exercise:** add a `console.log` inside `EventBus.emit` to print every
event name that passes through it during one run, and get a feel for how
much (or how little) traffic actually crosses the React/Phaser boundary.

### State management

**Concept:** gameplay state (score, player position, obstacle positions)
and UI state (which screen is showing, settings values) are kept in
completely separate systems - Phaser's own object properties for the
former, React state (`useState`, `usePersistentState`) for the latter -
rather than funneled through one shared global store.

**Where:** compare `GameScene`'s private fields (gameplay state) against
`App.tsx`'s `useState`/`useSaveData` calls (UI/persisted state).

**Exercise:** try to find a single piece of state in this codebase that's
duplicated in both React and Phaser. (There isn't one - that's
deliberate.)

---

## Level 5 — Performance Engineering

### Delta time

Covered in Level 1 above and [PERFORMANCE.md](PERFORMANCE.md).

### Object pooling

Covered in [ARCHITECTURE.md](ARCHITECTURE.md#entity-management),
[GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md#object-pooling), and
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#object-pooling-via-a-set-not-a-dedicated-pool-class).

**Exercise:** temporarily change `POOL_SIZE` in
[`ObstacleSpawner.ts`](../src/game/systems/ObstacleSpawner.ts) to `2` and
play until obstacles stop spawning even though the game logic wants to
spawn more - this reproduces pool exhaustion directly, and shows why
`acquire()` returning `undefined` has to be handled gracefully rather than
assumed impossible.

### Memory management

See [PERFORMANCE.md](PERFORMANCE.md#memory-cleanup).

### Rendering optimization

**Concept:** the cheapest optimization is not rendering something at all.
The "Low" quality setting in this project hides the far parallax layer and
the player's glow entirely rather than rendering them at reduced fidelity -
see [PERFORMANCE.md](PERFORMANCE.md#mobile-low-end-optimization-the-quality-setting).

### Responsive performance (bundle size)

This project's clearest, most measurable performance story: see
[PERFORMANCE.md](PERFORMANCE.md#code-splitting-measured-beforeafter) for
the full before/after numbers from moving Phaser out of the main bundle.

**Exercise:** run `npm run build` yourself and read the printed chunk
sizes. Then open [`EventBus.ts`](../src/game/EventBus.ts), temporarily
change it back to extend `Phaser.Events.EventEmitter` (you'll need to add
`import Phaser from 'phaser'` back), run the build again, and watch the
main chunk balloon back up. Revert the change afterward.

---

## Level 6 — Production Engineering

### Testing

See [TESTING.md](TESTING.md) in full.

### Debugging

See [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#debugging-workflow).

### Persistence

See [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md#localstorage-for-persistence-with-an-explicit-version-field)
and [`services/storage.ts`](../src/services/storage.ts).

**Exercise:** open DevTools, edit `localStorage['neon-rush-save']` to set
`"version": 1` with an old/partial shape, reload the page, and confirm the
migration path produces valid, usable save data rather than a crash.

### Git workflow

See [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#git-conventions) -
and more usefully, read the actual commit history
(`git log --oneline`) for this repository as a worked example of
one-commit-per-completed-piece-of-work discipline in practice.

### Build optimization

See [PERFORMANCE.md](PERFORMANCE.md#code-splitting-measured-beforeafter).

### Accessibility

**Concept:** respecting `prefers-reduced-motion` isn't one setting to flip -
it has to be honored everywhere motion is introduced, because different
libraries/APIs expose it differently.

**Where it's checked, and how, in this project:**

- CSS transitions/animations: a global `@media (prefers-reduced-motion:
reduce)` rule in [`index.css`](../src/index.css).
- Framer Motion's JS-driven animations: `<MotionConfig
reducedMotion="user">` wrapping the whole app in `App.tsx` - this is a
  single provider, not a per-component check.
- Phaser's `timeScale` slow-motion dip and camera shake: each checks
  `window.matchMedia('(prefers-reduced-motion: reduce)').matches` directly,
  since neither is a CSS or Framer Motion animation and so isn't covered by
  the other two mechanisms.

**Exercise:** enable "reduce motion" in your OS accessibility settings,
then trigger a near-miss and a game over - confirm the slow-motion dip and
camera shake don't occur, but the score bonus from the near-miss still
does.
