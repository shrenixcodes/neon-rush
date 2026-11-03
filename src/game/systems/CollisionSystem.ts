import Phaser from 'phaser'
import type { Player } from '@/game/entities/Player'
import type { Obstacle } from '@/game/entities/Obstacle'
import type { Coin } from '@/game/entities/Coin'

/**
 * Centralizes the one rule that decides whether an obstacle overlap is a hit: a
 * 'dodge' obstacle always hits on overlap, while 'jump'/'slide' obstacles only hit if
 * the player isn't in the matching state at that moment. Coin pickups have no such
 * condition - any overlap with an uncollected coin counts.
 */
export class CollisionSystem {
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  checkObstacleHit(player: Player, obstacles: ReadonlySet<Obstacle>): Obstacle | null {
    for (const obstacle of obstacles) {
      if (!this.scene.physics.overlap(player, obstacle)) continue

      const avoided =
        (obstacle.requiredAction === 'jump' && player.isAirborne()) ||
        (obstacle.requiredAction === 'slide' && player.state === 'sliding')
      if (avoided) continue

      return obstacle
    }
    return null
  }

  checkCoinPickups(player: Player, coins: ReadonlySet<Coin>): Coin[] {
    const collected: Coin[] = []
    for (const coin of coins) {
      if (coin.collected) continue
      if (this.scene.physics.overlap(player, coin)) {
        coin.collected = true
        collected.push(coin)
      }
    }
    return collected
  }
}
