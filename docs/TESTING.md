# Testing

## What's automated vs. what's manual, and why

Neon Rush splits its testing surface the same way its codebase is split:
dependency-free logic gets a real Vitest suite; everything that only means
anything inside a rendered Phaser canvas or in response to a real browser
gesture is verified by hand. This isn't a shortcut - a unit test that mocks
Arcade Physics, Phaser's Scene lifecycle, and `AudioContext` just to assert
a jump reaches a certain height would be testing the mocks, not the game.
The systems that _are_ pure functions or dependency-free classes
(`DifficultyManager`, `ComboManager`, the save migration, the daily seed)
get tested directly because they genuinely don't need any of that.

## Automated tests

```bash
npm run test
```

Four suites, 25 assertions total, covering:

- **[`DifficultyManager.test.ts`](../src/game/systems/DifficultyManager.test.ts)** -
  the difficulty curve is monotonic (speed never decreases as distance
  increases), interpolates correctly between breakpoints, clamps at both
  ends.
- **[`ComboManager.test.ts`](../src/game/systems/ComboManager.test.ts)** -
  the multiplier steps correctly with streak length, caps at the configured
  maximum, resets when the pickup window lapses or on an explicit reset.
- **[`dailyChallenge.test.ts`](../src/game/data/dailyChallenge.test.ts)** -
  the seeded RNG is deterministic for the same date and produces a
  different sequence for a different date.
- **[`storage.test.ts`](../src/services/storage.test.ts)** - the save
  schema migrates correctly from older versions and falls back to defaults
  for missing or corrupted data rather than throwing.

## Manual functional testing

Performed directly against a running dev server (and separately against
the production build via `npm run preview`, to catch anything that only
shows up post-bundling):

- Main menu loads, high score and coin totals render correctly.
- Play starts a run; Daily Challenge starts a run using the seeded RNG
  (verified deterministic by diffing the first obstacle wave across two
  separate runs started on the same day).
- Lane switching responds to A/D, arrow keys, and swipe gestures.
- Jump and slide respond to their bound keys, swipes, and the on-screen
  touch buttons, and are blocked while the player is already jumping or
  sliding.
- Obstacles spawn from the pattern library with correct lane assignment and
  rotation; no layout observed blocks every lane with incompatible
  required actions.
- Collision correctly distinguishes avoided (jump/slide, correct player
  state at overlap) from hit (dodge-type, or wrong state).
- Coins are collected, immediately despawned, and correctly feed the combo
  multiplier and score.
- Score, distance, and coins update live in the HUD via `EventBus`, without
  visibly affecting frame pacing.
- Difficulty (scroll speed, obstacle spacing, pattern variety) visibly
  increases the longer a run lasts.
- Pause freezes the run entirely (verified by sampling the scene's internal
  `distance` before and after a batch of frames while paused - it does not
  move) and resume picks back up from the exact same state, including
  mid-jump.
- Restart produces a fresh run with distance/score/combo all reset back to
  zero.
- High scores and the daily best persist across a full page reload
  (verified via `localStorage` contents, not just the UI).
- Characters unlock when affordable and are blocked - both by the disabled
  button and by the handler's own funds check - when not.
- Character selection and all settings persist across a reload.
- Mobile touch controls: swipe gestures (via Phaser pointer events) and the
  on-screen buttons (via `touch-*` EventBus events) both drive the same
  gameplay actions as keyboard input; the on-screen buttons are confirmed
  visible under an emulated coarse-pointer/mobile viewport and hidden under
  a desktop (fine-pointer) viewport.
- No console errors during any of the above.

## Edge cases specifically exercised

- **Rapid consecutive input:** double-tapping the same lane direction
  during an active lane-switch tween buffers the second input rather than
  dropping it or skipping an extra lane; tapping toward a boundary (already
  in lane 0, pressing left again) clamps correctly.
- **Switching lanes while jumping:** confirmed independent - a lane change
  initiated mid-air completes normally and the jump arc is unaffected.
- **Pausing during a jump:** the player's Y position is confirmed frozen
  (sampled before pause, during the paused window, and found unchanged)
  and resumes in the exact same `jumping` state afterward, with the jump
  completing normally.
- **Restarting repeatedly:** eight consecutive `scene.restart()` calls in a
  row, each producing a fresh, active scene with no growth in pooled
  obstacle/coin counts and no console errors.
- **Insufficient coins for an unlock:** the unlock button is disabled in
  the UI, and - separately - the handler itself re-checks funds and does
  not mutate save data even if called directly.
- **Window resizing / orientation:** Phaser's `Scale.FIT` mode recomputes
  the correct display size for a given parent size (verified directly via
  the Scale Manager's own calculation, matching the expected aspect-fit
  math for several parent dimensions); the browser-level `resize` →
  `ResizeObserver` → canvas-style-update pipeline that triggers this
  automatically is standard, long-established Phaser behavior.

## Build verification

```bash
npm run build
```

must complete with no type errors (the `prebuild` hook) and no bundler
errors. The build is also checked for its chunk layout specifically - see
[PERFORMANCE.md](PERFORMANCE.md) - since the whole point of code-splitting
Phaser out of the main bundle is defeated if it silently ends up back in
there.

## Reproducing this test pass

1. `npm install`
2. `npm run test` - all four suites should pass.
3. `npm run build` - should complete with no errors; inspect the printed
   chunk sizes and confirm there's a separate `PhaserGame-*.js` chunk
   distinct from the main `index-*.js` chunk.
4. `npm run dev` (or `npm run preview` against the build from step 3) and
   walk through the manual checklist above.
