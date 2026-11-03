# Collision Flow

This is what `GameScene.update()` does every frame, in order. It's the one
diagram worth reading alongside the actual source
([`GameScene.ts`](../../src/game/scenes/GameScene.ts)) since the order
matters: an obstacle hit returns early and skips everything after it.

```mermaid
flowchart TD
    Start["GameScene.update(time, delta)"] --> Distance["advance distance,<br/>scroll road + parallax by scrollSpeed * delta"]
    Distance --> PlayerUpdate["Player.update()<br/>run cycle, jump arc, body sync"]
    PlayerUpdate --> Difficulty["getDifficultyAt(distance)<br/>updates scrollSpeed for next frame"]
    Difficulty --> Spawners["ObstacleSpawner / CoinSpawner .update()<br/>advance active entities, despawn off-screen,<br/>spawn new waves/runs on distance cadence"]

    Spawners --> ObstacleCheck["CollisionSystem.checkObstacleHit(player, activeObstacles)"]
    ObstacleCheck -->|"physics.overlap() true"| ActionCheck{"obstacle.requiredAction"}
    ActionCheck -->|"'jump' and player.isAirborne()"| Avoided["avoided - no hit"]
    ActionCheck -->|"'slide' and player.state === 'sliding'"| Avoided
    ActionCheck -->|"'dodge', any player state"| Hit["hit"]
    ActionCheck -->|"'jump'/'slide', wrong player state"| Hit
    ObstacleCheck -->|"no overlap"| Continue["continue"]

    Hit --> GameOver["handleGameOver()<br/>emits 'game-over', stops the run"]
    Continue --> CoinCheck
    Avoided --> CoinCheck["CollisionSystem.checkCoinPickups(player, activeCoins)"]

    CoinCheck -->|"overlap, !coin.collected"| Collect["ComboManager.registerPickup()<br/>ScoreManager.addCoin(multiplier)<br/>CoinSpawner.collect() despawns it immediately"]
    CoinCheck -->|"none"| ComboTick
    Collect --> ComboTick["ComboManager.update(delta)<br/>resets streak if the pickup window lapsed"]

    ComboTick --> NearMiss["NearMissSystem.check(player, activeObstacles)<br/>'dodge' obstacles crossing the player's row"]
    NearMiss -->|"adjacent lane, not yet resolved"| Bonus["score bonus + brief slow-motion<br/>(skipped if prefers-reduced-motion)"]
    NearMiss -->|"same lane (already a hit) or far lane"| Emit
    Bonus --> Emit["emit score-changed / distance-changed"]
```

## Why the avoidance rule is a single function

Every obstacle's avoidance behavior reduces to one check in
`CollisionSystem.checkObstacleHit()`:

```ts
const avoided =
  (obstacle.requiredAction === 'jump' && player.isAirborne()) ||
  (obstacle.requiredAction === 'slide' && player.state === 'sliding')
```

`'dodge'` obstacles have no corresponding clause, so they always count as a
hit on overlap - the only way to avoid one is to not be in its lane, which
the physics overlap check already handles for free (a different-lane
obstacle simply never overlaps the player's body). This is also why the
near-miss and collision systems can share the same `requiredAction` field
instead of needing separate obstacle categorization.
