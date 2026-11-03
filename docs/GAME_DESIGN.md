# Game Design

## Concept

Neon Rush is a lane-based endless runner set in a cyberpunk city at night.
The player character runs forward automatically; survival depends entirely
on reacting to oncoming obstacles with three actions - change lane, jump,
or slide - while collecting coins along the way. The theme was chosen
because a neon-soaked skyline gives a flat 2D canvas game a strong sense of
place and depth (parallax skyline, glowing obstacles, a synthesized
electronic soundtrack) without needing 3D rendering or external art.

## Core loop

Run → react to the next obstacle wave → collect coins when the layout
allows it → watch the pace pick up → eventually get caught out by a harder
combination → see the final score → try again, either to beat a personal
best or to unlock the next character with the coins just earned. The loop
is intentionally short per attempt (most runs are well under a minute at
first) so "one more try" stays cheap.

## Why three mechanical categories, not six

The six obstacle types in [`data/obstacles.ts`](../src/game/data/obstacles.ts)
map onto exactly three avoidance rules - jump, slide, or change lane - not
six unique behaviors. A road barrier and a ground hazard are mechanically
identical (both require a jump); they exist as separate entries purely for
visual variety, so the run doesn't look the same every time a jump is
required. This keeps the rule a player has to learn small (three responses)
while still satisfying "give me varied obstacle appearances."

## Why the moving drone is still fair

The drone is the one obstacle that moves within its own lane rather than
sitting still. It never crosses into a neighboring lane - if it did, it
would need the same fairness guarantees the pattern system gives static
obstacles (never block every lane at once), which would mean either
hand-authoring drone movement into every pattern or adding a runtime
fairness check just for it. Keeping its motion lane-local gets the "time
movement carefully" feel (the exact moment it's safe to pass is harder to
read than a static obstacle) without touching the pattern-fairness
guarantees at all.

## Character unlocks are cosmetic by design

Every character is the same rigged silhouette with a different color
palette - see [`data/characters.ts`](../src/game/data/characters.ts) and
[`CharacterPreview.tsx`](../src/components/CharacterSelect/CharacterPreview.tsx).
None of them run faster, jump higher, or get a bigger hitbox. The unlock
currency is the same coins earned by playing, so progression is purely "you
got good at the game, here's a new look," never "pay or grind for an
advantage." This was a deliberate line, not an oversight - a runner where
the unlockable characters are mechanically different would undermine
comparing high scores at all.

## Daily challenge: what it actually is

The daily challenge is a **seeded, locally-reproducible layout**, not a
networked competition. A deterministic RNG is derived from the current
date (`YYYY-MM-DD`, see
[`data/dailyChallenge.ts`](../src/game/data/dailyChallenge.ts)) and fed into
the same `ObstacleSpawner`/`CoinSpawner` used by endless mode, so every
player who opens the game on the same day sees exactly the same obstacle
and coin sequence. Its best score is tracked separately from the endless
high score, per calendar day.

**What this project does not claim:** there is no backend, no server, and
no way to compare today's best against another player's. "Today's Best" on
the main menu is the best score _this browser_ has recorded for today's
seed. Calling it a leaderboard would overstate what it is - it's documented
here as a local personal-best-for-today's-layout feature, which is what it
actually is.

## Ghost replay: what it replays

A ghost is a compact log of _actions_, not a recording of every frame's
position. [`ReplayRecorder`](../src/game/systems/ReplayRecorder.ts) logs
`{ distance, type: 'lane' | 'jump' | 'slide', lane? }` only for actions that
actually took effect (a jump pressed while already airborne is silently
ignored, so it's never recorded either). The log is keyed by **distance
travelled**, not elapsed time - since both the live run and any future
replay of it advance through the identical distance-based difficulty curve,
"do X once distance reaches N" stays correctly timed regardless of frame
rate or how fast either run happens to be going. [`GhostRunner`](../src/game/entities/GhostRunner.ts)
is a second, fully real `Player` instance with its physics body disabled
(so it can never collide or collect coins) that replays the log against the
current run's distance. Only the single best endless run is kept - saving
every attempt was never the goal, just "race your best."

## Visual and audio identity

Every obstacle, the coin, the player's silhouette, the road, and the
skyline are drawn with `Phaser.GameObjects.Graphics` at load time - there
are no external image or sprite-sheet assets in this project. Every sound
is synthesized at runtime with the Web Audio API - there are no bundled or
licensed audio files either. Both choices are explained in full in
[TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md); the short version is that
it keeps the project entirely self-contained and avoids any question of
asset licensing.

## What was deliberately left out

- **No global leaderboard or online multiplayer** - no backend exists in
  this project (see Daily Challenge above).
- **No pay-to-unlock or ads** - unlocks only ever cost in-run coins.
- **No difficulty settings beyond the built-in curve** - the game is tuned
  to one curve; a "quality" setting in Settings affects visual effects, not
  difficulty.
