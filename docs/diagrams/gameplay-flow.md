# Gameplay Flow

```mermaid
flowchart TD
    Menu["Main Menu"] -->|Play| Load["GameCanvas: dynamic import('@/game/PhaserGame')"]
    Menu -->|Daily Challenge| Load
    Load --> Boot["BootScene"] --> Preload["PreloadScene<br/>generates all textures procedurally"] --> Create["GameScene.create()"]
    Create --> Running["Running<br/>input, spawners, collision checks every frame"]
    Running -->|Esc / pause button / swipe N/A| Paused["scene.pause()"]
    Paused -->|Resume| Running
    Paused -->|Restart| Create
    Paused -->|Main Menu| Menu
    Running -->|Obstacle overlap, action mismatch| GameOver["handleGameOver()"]
    GameOver --> Screen["Game Over screen<br/>score reveal, New High Score / New Daily Best"]
    Screen -->|Restart| Create
    Screen -->|Main Menu| Menu
```

## Notes on this flow

- **The loading step is real, not decorative.** Phaser is lazy-loaded only
  when a run actually starts (see
  [TECHNICAL_DECISIONS.md](../TECHNICAL_DECISIONS.md)), so there is a brief
  "Loading run..." state between pressing Play and the canvas existing.
- **Restart re-enters at `Create`, not `Boot`.** `scene.restart()` tears down
  and re-runs `GameScene.create()` directly; Boot/Preload only run once per
  page load, since the generated textures don't change between runs.
- **Game over is driven entirely by `GameScene`**, not by the UI. The scene
  decides a run has ended (an unavoidable obstacle overlap), updates the
  registry if a new best was set, and emits a single `game-over` event with
  everything the UI needs (score, distance, coins, which kind of best was
  beaten, and the recorded ghost events if this is the new endless best).
  `App.tsx`'s listener is what actually writes that into `localStorage` -
  GameScene never touches storage directly.
