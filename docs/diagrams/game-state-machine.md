# Game State Machine

This covers the top-level screen/run state (owned by `App.tsx`'s `screen`
state plus `GameScene`'s internal `isGameOver`/pause flags). It's a separate
concern from the player entity's own state machine
(`running` / `jumping` / `sliding` / `dead`), which is documented in
[GAMEPLAY_SYSTEMS.md](../GAMEPLAY_SYSTEMS.md).

```mermaid
stateDiagram-v2
    [*] --> MainMenu

    MainMenu --> CharacterSelect : Characters
    MainMenu --> HowToPlay : How To Play
    MainMenu --> Settings : Settings
    MainMenu --> Loading : Play / Daily Challenge

    CharacterSelect --> MainMenu : Back
    HowToPlay --> MainMenu : Back
    Settings --> MainMenu : Back

    Loading --> Playing : Phaser chunk loaded,<br/>GameScene.create() ran

    Playing --> Paused : pause-requested
    Paused --> Playing : resume-requested
    Paused --> Playing : restart-requested<br/>(scene.restart())
    Paused --> MainMenu : Main Menu button

    Playing --> GameOver : obstacle collision
    GameOver --> Playing : restart-requested
    GameOver --> MainMenu : Main Menu button
```

## Why pause/resume/restart are commands, not screens

`Paused` and `GameOver` are not separate React screens - the `playing`
screen stays mounted (so the `GameCanvas` and its Phaser instance never
unmount and remount), and `PauseScreen`/`GameOverScreen` are overlays drawn
conditionally based on events `useGameEvents` has received from
`EventBus`. The actual pause/resume/restart _behavior_ lives entirely in
`GameScene`:

- `pause-requested` → `GameScene.requestPause()` → `this.scene.pause()`
- `resume-requested` → `GameScene.requestResume()` → `this.scene.resume()`
- `restart-requested` → `this.scene.restart()`, which re-runs `create()`

A paused Phaser scene stops calling `update()` entirely, which is what
actually freezes gameplay - there's no separate "is the game logically
paused" flag that every system has to remember to check.
