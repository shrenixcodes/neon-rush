# Technical Decisions

Each entry: what was chosen, what the alternative was, and why.

## Phaser for gameplay rendering

**Chosen:** Phaser 3, pinned to the `3.90.x` line explicitly rather than
letting it float to the newly-released Phaser 4.

**Alternative considered:** Phaser 4, which `npm install phaser` resolves to
by default at the time of writing. It was installed first, then
deliberately downgraded.

**Why:** Phaser 4 is a very recent major rewrite. Betting an entire
project's Arcade Physics, Scene lifecycle, and texture-generation code on a
major version with limited real-world mileage is a real risk - subtle API
differences from the thoroughly documented, battle-tested Phaser 3 line
would be easy to get wrong and hard to debug. Phaser 3's Arcade Physics,
`Graphics.generateTexture()`, Scene plugin system, and Tweens are all
extremely well-documented and used in production by a huge number of
shipped games - for this project's purposes, familiarity and documentation
depth mattered more than being on the newest release.

## React for the interface layer, kept strictly separate from Phaser

**Chosen:** React owns every menu/HUD/overlay; Phaser owns only the canvas
contents; the two communicate exclusively through a pub/sub event bus.

**Alternative considered:** rendering HUD elements as Phaser `Text`/`Image`
objects inside the scene itself, which is the more common approach in
tutorials and some production games.

**Why:** building menus, forms, and animated overlays in Phaser's
GameObject API is considerably more work than in JSX + Tailwind, and doing
so would mean reaching into the Phaser scene from "UI code" constantly.
Keeping the boundary strict - React never touches a Phaser GameObject, and
Phaser never touches a React component - means neither side needs to know
the other exists beyond the event contract in
[`game/types/events.ts`](../src/game/types/events.ts). The real cost of this
choice was discovered during the performance pass: see "EventBus has no
Phaser dependency" below.

## TypeScript everywhere

**Chosen:** TypeScript for every file, strict compiler settings
(`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`,
`erasableSyntaxOnly`).

**Why:** a project this size has a lot of structured data passing between
systems (obstacle definitions, difficulty breakpoints, the save schema, the
event map) where a typo or a shape mismatch would otherwise only surface at
runtime, mid-run. `erasableSyntaxOnly` in particular ruled out TypeScript
parameter-property shorthand (`constructor(private readonly x: Foo)`)
in a few places - it compiles to real assignment statements rather than
type-only syntax, which this project's `tsconfig.app.json` deliberately
forbids so that every `.ts` file's type annotations could, in principle, be
stripped by a type-oblivious tool without changing behavior.

## Delta-time-driven movement, not frame counting

**Chosen:** every system that advances over time (`Player`, `ObstacleSpawner`,
`CoinSpawner`, `ParallaxBackground`, `DifficultyManager`'s caller) takes a
`delta` (milliseconds since the last frame) and scales its own movement by
it - `distance += (scrollSpeed * delta) / 1000`, not `distance +=
scrollSpeed` once per frame.

**Why:** a fixed per-frame increment ties gameplay speed to the display's
refresh rate - the exact same code would run the game twice as fast on a
144Hz display as on a 60Hz one. Scaling every increment by `delta` keeps
pixels-per-second constant regardless of frame rate.

## Object pooling via a `Set`, not a dedicated pool class

**Chosen:** `ObstacleSpawner` and `CoinSpawner` each hold a fixed-size
array built once and a `Set` tracking which members are currently active;
`acquire()` is `this.pool.find((o) => !this.active.has(o))`.

**Alternative considered:** a generic `ObjectPool<T>` utility class shared
by both spawners.

**Why:** the two spawners' acquire/release patterns are nearly identical
but not identical enough to share a meaningfully simpler abstraction - the
coin spawner also needs an obstacle-proximity check before committing to a
lane, and the obstacle spawner needs pattern/rotation logic the coin
spawner doesn't. A shared generic pool class would have added a layer of
indirection to look through without actually removing any of that
spawner-specific logic. At the scale this game runs (well under 50 pooled
entities total), the `Set`-based approach is simple enough to read in one
pass and doesn't need to be more general than it is.

## EventBus has no Phaser dependency

**Chosen:** a ~30-line hand-rolled `Map<event, Set<listener>>` emitter.

**Original implementation:** `class TypedEventBus extends
Phaser.Events.EventEmitter`, typed on top with the event map.

**Why it changed:** `import Phaser from 'phaser'` pulls the _entire_ engine
into whichever JavaScript chunk imports it, because Phaser ships as one
large namespace object rather than granular submodules. `EventBus` is
imported eagerly by React components (`App.tsx`'s game-over listener, the
HUD, pause screen, touch controls) that are rendered immediately - none of
them are behind the dynamic `import('@/game/PhaserGame')` that keeps Phaser
out of the initial bundle. The result, measured directly: with `EventBus`
extending Phaser's emitter, the production build's main chunk was
**1.57MB**; after replacing it with a dependency-free emitter, the main
chunk dropped to **382KB**, with the actual Phaser engine moved entirely
into the separate, lazily-loaded `PhaserGame-*.js` chunk (1.22MB, only
fetched once a run starts). See [PERFORMANCE.md](PERFORMANCE.md) for the
full before/after.

## Lazy-loading Phaser instead of bundling it eagerly

**Chosen:** `GameCanvas.tsx` imports `@/game/PhaserGame` with a dynamic
`import()` inside its mount effect, not a static `import` at the top of the
file.

**Why:** the main menu, character select, settings, and how-to-play screens
never touch Phaser at all. Shipping the entire engine as part of the
initial page load for a screen that doesn't need it yet is pure waste - the
dynamic import defers that ~1.2MB download until the player actually
presses Play or Daily Challenge, at the cost of a brief "Loading run..."
state the first time.

## Procedurally generated visuals, no image assets

**Chosen:** every visual - the road, the skyline, every obstacle type, the
coin, and the player's silhouette - is drawn with
`Phaser.GameObjects.Graphics` and baked into a texture once via
`generateTexture()` in [`PreloadScene`](../src/game/scenes/PreloadScene.ts).

**Why:** no image or sprite-sheet files exist anywhere in this repository.
This keeps the project entirely self-contained - nothing to source, license,
or attribute - and keeps the initial download small (procedural generation
costs a few milliseconds at load time; it costs zero bytes over the wire).
The player's run cycle, in particular, is achieved by rotating individual
limb shapes inside a `Container` each frame rather than by swapping sprite
frames - a cheaper stand-in for frame animation that still reads as motion.

## Synthesized audio, no audio files

**Chosen:** [`AudioManager`](../src/game/systems/AudioManager.ts) generates
every sound effect and the background music loop at runtime with raw
`OscillatorNode`s, a short noise buffer for the collision sound, and
`GainNode` envelopes - no `<audio>` elements, no bundled `.mp3`/`.wav`
files.

**Why:** the same reasoning as the visuals - avoiding any question of where
licensed or royalty-free audio came from, and keeping the download size
unaffected by audio entirely. The trade-off is honest: these are simple
oscillator-based tones and arpeggios, not a mixed and mastered soundtrack.
`unlock()` is only ever called from inside a real `pointerdown`/`keydown`
handler in `App.tsx`, since browsers refuse to start an `AudioContext`
without a user gesture.

## localStorage for persistence, with an explicit version field

**Chosen:** a single JSON blob under one `localStorage` key
([`services/storage.ts`](../src/services/storage.ts)), with a `version`
field and a migration function that runs on every load.

**Alternative considered:** IndexedDB, or a remote save (would require a
backend, which this project deliberately doesn't have - see
[GAME_DESIGN.md](GAME_DESIGN.md)).

**Why:** the save payload is small (a handful of numbers, a short array of
unlocked IDs, a compact ghost-replay event log) and read/written
synchronously at most a few times per session - `localStorage`'s
synchronous API is simpler to reason about than IndexedDB's for data this
size, and there's no cross-tab or background-sync requirement that would
justify the extra complexity. The version field exists so a future schema
change (adding a field, renaming one) has a defined migration path instead
of silently corrupting or discarding existing players' progress - see
`services/storage.ts` for the actual migration function and
[`storage.test.ts`](../src/services/storage.test.ts) for the tests covering
missing/corrupted/old-version data.

## Manual overlap checks instead of persistent Arcade colliders

**Chosen:** `CollisionSystem` calls `this.physics.overlap(player, entity)`
directly, once per active obstacle/coin, inside `GameScene.update()`.

**Alternative considered:** `this.physics.add.overlap(player, group,
callback)`, registered once with a Phaser Group.

**Why:** the "active" set of obstacles and coins changes shape every frame
as pooled entities spawn and despawn, which doesn't map cleanly onto
Phaser's Group-based collider API without extra bookkeeping to keep the
group's membership in sync with the pool's active set. At the entity counts
this game actually runs (comfortably under 50 active bodies at once), a
manual per-frame overlap loop is simple, easy to read top-to-bottom in
`GameScene.update()`, and has no measurable performance cost - a spatial
partitioning scheme would be solving a problem this game doesn't have.

## Lane positions are a function of `ROAD_WIDTH`, not canvas width

**Chosen:** `LANE_X` is computed from `ROAD_MARGIN`/`ROAD_WIDTH`
([`gameConfig.ts`](../src/game/config/gameConfig.ts)), where `ROAD_WIDTH =
GAME_WIDTH - ROAD_MARGIN * 2`.

**Why:** the margins on either side of the road are where
`ParallaxBackground` renders the scrolling skyline. Lanes centered on the
full canvas width would either overlap the skyline or require shrinking the
lanes after the fact; deriving lane geometry from the road's actual width
up front means the two systems can never disagree about where the
playable area ends.
