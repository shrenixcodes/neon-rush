# Gameplay Systems

Each section below covers one system: the problem it solves, how it works,
its inputs/outputs, the implementation decisions behind it, how it talks to
other systems, and the edge cases it has to handle. File references point
at the real source, not a simplified version of it.

## Three-lane movement

**Problem:** move the player between three fixed horizontal positions
without a teleport, while still feeling responsive to rapid input.

**How it works:** [`LaneController`](../src/game/systems/LaneController.ts)
tracks a `currentLane` index (0-2) and tweens `Player.x` to `LANE_X[lane]`
over `LANE_SWITCH_MS` (150ms). If a new move request arrives while a tween
is already running, it's stored in `queuedDirection` rather than dropped or
applied immediately; the tween's `onComplete` checks for a queued direction
and immediately starts the next move. A direction that would go out of
bounds (already in lane 0, pressing left again) is clamped and the queue is
cleared rather than left dangling.

**Inputs:** `moveLeft()` / `moveRight()`, called from `InputManager`'s
keyboard/swipe handlers and from `GameScene`'s `touch-move-*` listeners.
**Outputs:** `Player.x` (via tween) and `Player.laneIndex` (set
synchronously, not when the tween finishes - obstacle lane-matching and
near-miss checks care about which lane the player is _committed_ to, not
where they are mid-slide).

**Decisions:** the lane boundaries are computed from `ROAD_WIDTH` /
`ROAD_MARGIN`, not the full canvas width - see
[`gameConfig.ts`](../src/game/config/gameConfig.ts) - because the margins on
either side are reserved for the scrolling skyline
(`ParallaxBackground`). A constructor callback (`onLaneChanged`) fires
exactly when `currentLane` changes, which is what `ReplayRecorder` hooks
into to log lane changes at the correct distance - see
[`GameScene.create()`](../src/game/scenes/GameScene.ts).

**Edge cases:** double-tapping the same direction clamps at the boundary
without re-queuing; a tap during an active tween is buffered, not dropped;
switching lanes while jumping or sliding works independently since lane
position (x) and vertical state (y, hitbox) are governed by separate code
paths.

## Player state and the Arcade-physics / tween conflict

**Problem:** [`Player`](../src/game/entities/Player.ts) needs its position
driven by three different mechanisms at once - Arcade Physics velocity
(during a jump), `Phaser.Tweens` (during a lane switch), and plain
assignment (snapping to the baseline on landing, or into a crouch for a
slide) - without any of them fighting each other.

**How it works:** Arcade Physics bodies re-derive the game object's
transform from the body's own stored position every physics step
(`body.postUpdate()`), which silently overwrites anything a tween or a
direct assignment did to `x`/`y` in between steps. `Player.update()` ends
with `this.body.updateFromGameObject()` every single frame, which pulls the
body's stored position back into sync with whatever the container's actual
transform is at that point - after the tween and after any manual
adjustment. This one line is what lets a lane-switch tween and a jump arc
coexist on the same object.

**State machine:** `running → jumping → running` (gravity-driven, see
below) and `running → sliding → running` (timer-driven, 480ms). `dead` is
terminal, set once by `GameScene.handleGameOver()`. Jump and slide are
mutually exclusive by construction - both check `if (this.state !==
'running') return false` before doing anything, so a player can't start a
slide mid-jump or vice versa; lane changes are allowed in any state since
they're a different axis entirely.

**Edge case worth calling out:** gravity on the body is switched **off**
(`setGravityY(0)`) except during the active jump window. Leaving world
gravity on permanently - the obvious first implementation - caused the
player to slowly sink below the running baseline even while `state ===
'running'`, since Arcade Physics integrates gravity into velocity every
step regardless of game-logic state. Gravity is only turned on in `jump()`
and back off the moment the landing check fires in `updateJumpPhysics()`.

## Jump mechanics

**How it works:** `jump()` sets `state = 'jumping'`, turns gravity on, and
sets an upward velocity (`JUMP_VELOCITY`, negative = up). Each frame,
`updateJumpPhysics()` leans the sprite slightly forward in proportion to
current velocity (purely cosmetic) and checks the landing condition: `y >=
baselineY && velocity.y >= 0` (back at or below the baseline, moving
downward or stopped). On landing it snaps `y` to the exact baseline, zeroes
velocity, zeroes gravity, and returns to `running`.

**Why snap exactly to baseline:** Arcade Physics integrates position in
discrete steps, so the frame that crosses the landing threshold almost never
lands on _exactly_ the baseline Y - without the snap the player would come
to rest a few pixels into the ground texture. Snapping avoids visible
sub-pixel drift accumulating run after run.

## Sliding mechanics

**How it works:** `slide()` shrinks the Arcade body directly -
`body.setSize(width, height * SLIDE_HEIGHT_SCALE)` and a matching
`setOffset` - rather than scaling the container. The crouched pose is
achieved by repositioning the child shapes (torso, head, arms, legs)
individually in `applySlidePose()`, not by scaling the container's
`scaleY`.

**Why not just scale the container:** the obvious implementation - set
`this.scaleY = 0.5` for the crouch look, alongside `setSize` for the
hitbox - produces a hitbox half the intended size. `Player.update()`'s
`body.updateFromGameObject()` (needed for the lane/jump reasons above)
re-derives the body's size from the container's _current_ scale every
frame, so a scaled container and an explicit `setSize` call compound
instead of composing: `PLAYER_HEIGHT * SLIDE_HEIGHT_SCALE` set once, then
multiplied by `scaleY = SLIDE_HEIGHT_SCALE` again on the very next frame,
landing at a quarter height instead of half. Keeping the container's own
scale at `1` at all times and only ever touching child-shape poses and the
body's explicit size avoids the compounding entirely.

**Edge case:** re-sliding while already sliding cancels and restarts the
timer (`slideTimer?.remove()` before scheduling a new one) rather than
stacking two pending `endSlide()` calls.

## Obstacle system

**Problem:** spawn varied obstacles that require jumping, sliding, or a
lane change, at increasing frequency, without ever producing a layout the
player can't survive.

**How it works:** [`data/obstacles.ts`](../src/game/data/obstacles.ts)
defines six obstacle types, each tagged with exactly one `requiredAction`:
`'jump'` (barrier, hazard), `'slide'` (laser), or `'dodge'` (vehicle,
energy wall, drone - lane position is the only defense). Fairness is
enforced by pre-authoring whole **patterns** rather than placing obstacles
independently: a pattern is a 3-lane array where each slot is either `null`
(clear) or `{ lane, obstacleId }`, built so that either every occupied lane
shares one action, or at least one lane is always empty.
[`ObstacleSpawner`](../src/game/systems/ObstacleSpawner.ts) filters patterns
by the current `patternTier` (unlocked by distance), picks one at random,
applies a random lane rotation and optional mirror, and spawns its slots
from a pooled set of `Obstacle` instances.

**Spacing:** distance-based, not time-based - `distanceSinceLastWave`
accumulates every frame and triggers the next wave once it exceeds
`obstacleGap` (itself a function of difficulty). This keeps visual spacing
consistent as `scrollSpeed` increases, rather than waves bunching up at
higher speed.

**The moving drone:** the one obstacle with `moves: true`. It's still a
single-lane `'dodge'` obstacle for fairness purposes - it just oscillates
within its own lane (±30% of lane width, sine wave) rather than sitting
still, which is what makes "time movement carefully" a real distinction
from the static vehicle/wall obstacles.

**Edge cases:** the pool (18 instances) is large enough that no in-flight
wave combination exhausts it; `acquire()` returning `undefined` (pool
exhausted) is handled by silently skipping that slot rather than throwing.

## Coin collection

**How it works:** [`CoinSpawner`](../src/game/systems/CoinSpawner.ts) spawns
runs of 4 coins in a single lane on its own distance cadence, independent of
the obstacle spawner. Before committing to a lane, it checks whether any
active obstacle is near the spawn point in that lane
(`OBSTACLE_PROXIMITY_GUARD`) and tries a different lane rather than stacking
coins on an unreachable obstacle. Collection
(`CollisionSystem.checkCoinPickups`) marks the coin `collected` and
immediately despawns it via `CoinSpawner.collect()`, rather than waiting for
it to scroll off-screen naturally.

## Combo multiplier

**How it works:** [`ComboManager`](../src/game/systems/ComboManager.ts)
tracks a `streak` (consecutive pickups) and a rolling window
(`COMBO_WINDOW_MS`, 2.2s). Every pickup resets the window and increments the
streak; `update(delta)`, called every frame, resets the streak to zero if
the window lapses without a new pickup. The multiplier is _derived_ from
the streak (`1 + floor(streak / 3) * 0.5`, capped at 4) rather than stored
alongside it, so the two values can never drift out of sync. A collision
(`GameScene.handleGameOver`) calls `reset()` directly.

## Scoring

Covered in [ARCHITECTURE.md](ARCHITECTURE.md#score-calculation).
`ScoreManager.addCoin(multiplier)` is what actually applies the combo
multiplier to a pickup's value; `ComboManager` only tracks the multiplier
itself, it never touches score.

## Difficulty scaling

Covered in [ARCHITECTURE.md](ARCHITECTURE.md#difficulty-management). The
curve itself lives in
[`data/difficultyCurve.ts`](../src/game/data/difficultyCurve.ts) as a short
list of `{ distance, scrollSpeed, obstacleGap, patternTier }` breakpoints -
tuning the game's pacing is editing that one table, not touching any
system's code.

## Near-miss bonus and slow motion

**How it works:** [`NearMissSystem`](../src/game/systems/NearMissSystem.ts)
watches every active `'dodge'`-type obstacle (the only type where lane
position alone decides the outcome). When one crosses within
`NEAR_MISS_BAND` pixels of the player's row _without_ having overlapped, and
its lane is exactly one away from the player's current lane, that counts as
a deliberate close call: a score bonus, plus a ~170ms dip in
`scene.time.timeScale` and `scene.physics.world.timeScale` for a cinematic
slow-motion beat. Each obstacle is marked `resolved` the first time it's
checked in the band, so the same near-miss can't fire on consecutive frames
while it's still inside the band.

**Why a native `setTimeout` restores the time scale:** scheduling the
restore through Phaser's own clock (`scene.time.delayedCall`) would be
scheduling it on the clock that's about to be slowed down - it would take
~3x longer than intended to fire. A real `window.setTimeout` runs on real
wall-clock time regardless of `timeScale`.

**Accessibility:** the slow-motion dip is skipped entirely under
`prefers-reduced-motion: reduce` (checked once at construction); the score
bonus still applies either way.

## Object pooling

Covered in
[ARCHITECTURE.md](ARCHITECTURE.md#entity-management). The practical effect:
over an arbitrarily long endless run, obstacle and coin allocation is
bounded at pool-creation time (18 obstacles, 24 coins) and never grows,
regardless of how long the player survives.

## Parallax movement and city environments

**How it works:** [`ParallaxBackground`](../src/game/systems/ParallaxBackground.ts)
scrolls four `TileSprite` strips (far/near skyline on each margin) at
different fractions of the road's scroll speed (0.35x and 0.75x) - the
difference in speed is the entire depth illusion, since the textures
themselves are flat. A full-canvas sky gradient sits behind everything and
crossfades between environments over 700ms; the narrow skyline strips swap
texture instantly instead, since at `ROAD_MARGIN` pixels wide a fade there
wouldn't be visible anyway. Which of the four environments
([`data/environments.ts`](../src/game/data/environments.ts)) is showing is a
pure function of distance (`floor(distance / SEGMENT_LENGTH) % 4`), so a
long enough run cycles through all four repeatedly rather than settling on
the last one forever.
