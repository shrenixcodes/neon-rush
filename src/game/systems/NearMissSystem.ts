import Phaser from 'phaser'
import type { Player } from '@/game/entities/Player'
import type { Obstacle } from '@/game/entities/Obstacle'
import { PLAYER_ROW_Y } from '@/game/config/gameConfig'

const NEAR_MISS_BAND = 50
const SLOW_MOTION_SCALE = 0.35
const SLOW_MOTION_REAL_MS = 170

/**
 * Watches 'dodge' obstacles (the only type lane position alone decides) as they cross
 * the player's row. An obstacle that passes one lane over from the player, without
 * having overlapped, reads as a deliberate close call and earns a small bonus plus a
 * brief slow-motion dip for game feel. The dip is scheduled with a native timer
 * rather than Phaser's clock, since Phaser's own delayedCall would itself be slowed
 * down by the timeScale change it's meant to undo.
 */
export class NearMissSystem {
  private readonly scene: Phaser.Scene
  private readonly skipSlowMotion: boolean

  constructor(scene: Phaser.Scene, lowQuality: boolean) {
    this.scene = scene
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.skipSlowMotion = reducedMotion || lowQuality
  }

  check(player: Player, obstacles: ReadonlySet<Obstacle>): boolean {
    let triggered = false

    for (const obstacle of obstacles) {
      if (obstacle.resolved || obstacle.requiredAction !== 'dodge') continue
      if (Math.abs(obstacle.y - PLAYER_ROW_Y) > NEAR_MISS_BAND) continue

      obstacle.resolved = true
      const laneDistance = Math.abs(obstacle.laneIndex - player.laneIndex)
      if (laneDistance === 1) {
        triggered = true
      }
    }

    if (triggered) {
      this.triggerSlowMotion()
    }
    return triggered
  }

  private triggerSlowMotion(): void {
    if (this.skipSlowMotion) return

    this.scene.time.timeScale = SLOW_MOTION_SCALE
    this.scene.physics.world.timeScale = SLOW_MOTION_SCALE

    // A real setTimeout, deliberately not scheduled through Phaser's clock - that
    // clock is itself running at the slowed timeScale we are about to restore.
    window.setTimeout(() => {
      this.scene.time.timeScale = 1
      this.scene.physics.world.timeScale = 1
    }, SLOW_MOTION_REAL_MS)
  }
}
