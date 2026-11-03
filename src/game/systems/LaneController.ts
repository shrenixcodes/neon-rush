import Phaser from 'phaser'
import type { Player } from '@/game/entities/Player'
import { LANE_COUNT, LANE_SWITCH_MS, LANE_X } from '@/game/config/gameConfig'

/**
 * Drives lane changes with a tween rather than an instant teleport, and buffers a
 * single queued direction while a switch is already animating. Without the buffer,
 * a quick double-tap during the ~150ms tween would simply be dropped, which reads as
 * unresponsive; queuing it to fire the instant the current tween completes keeps
 * rapid input feeling snappy without letting the player skip through multiple lanes
 * in one unbroken motion.
 */
export class LaneController {
  private currentLane = 1
  private isTweening = false
  private queuedDirection = 0
  private readonly scene: Phaser.Scene
  private readonly player: Player

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player
    this.player.laneIndex = this.currentLane
  }

  moveLeft(): void {
    this.requestMove(-1)
  }

  moveRight(): void {
    this.requestMove(1)
  }

  private requestMove(direction: -1 | 1): void {
    if (this.isTweening) {
      this.queuedDirection = direction
      return
    }
    this.performMove(direction)
  }

  private performMove(direction: -1 | 1): void {
    const targetLane = Phaser.Math.Clamp(this.currentLane + direction, 0, LANE_COUNT - 1)
    if (targetLane === this.currentLane) {
      this.queuedDirection = 0
      return
    }

    this.currentLane = targetLane
    this.player.laneIndex = targetLane
    this.isTweening = true

    this.scene.tweens.add({
      targets: this.player,
      x: LANE_X[targetLane],
      duration: LANE_SWITCH_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isTweening = false
        if (this.queuedDirection !== 0) {
          const next = this.queuedDirection as -1 | 1
          this.queuedDirection = 0
          this.performMove(next)
        }
      },
    })
  }

  getCurrentLane(): number {
    return this.currentLane
  }
}
