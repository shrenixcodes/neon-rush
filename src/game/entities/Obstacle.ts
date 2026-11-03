import Phaser from 'phaser'
import type { ObstacleAction, ObstacleDefinition } from '@/game/data/obstacles'
import { LANE_WIDTH } from '@/game/config/gameConfig'

const DRONE_WOBBLE_AMPLITUDE = LANE_WIDTH * 0.3
const DRONE_WOBBLE_PERIOD_MS = 900

/**
 * A single pooled obstacle sprite. Instances are created once by ObstacleSpawner and
 * reused via spawn()/deactivate() rather than constructed and destroyed per wave -
 * endless runners spawn obstacles continuously for the whole run, so pooling avoids
 * steady garbage-collection pressure from one-shot allocations.
 */
export class Obstacle extends Phaser.Physics.Arcade.Sprite {
  obstacleId = ''
  requiredAction: ObstacleAction = 'jump'
  laneIndex = 0
  moves = false
  /** Set once an overlap with the player has already been resolved, so a single
   * pass-through pair of bodies can't be double-counted across frames. */
  resolved = false

  private wobbleOriginX = 0
  private wobbleElapsed = 0

  constructor(scene: Phaser.Scene) {
    super(scene, -200, -200, 'obstacle-barrier')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setActive(false)
    this.setVisible(false)
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
  }

  spawn(
    definition: ObstacleDefinition,
    lane: number,
    x: number,
    y: number,
    scrollSpeed: number,
  ): void {
    this.obstacleId = definition.id
    this.requiredAction = definition.requiredAction
    this.laneIndex = lane
    this.moves = Boolean(definition.moves)
    this.resolved = false
    this.wobbleOriginX = x
    this.wobbleElapsed = 0

    this.setTexture(definition.textureKey)
    this.setPosition(x, y)
    this.setActive(true)
    this.setVisible(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(definition.hitboxWidth, definition.hitboxHeight)
    body.setOffset(
      (definition.displayWidth - definition.hitboxWidth) / 2,
      (definition.displayHeight - definition.hitboxHeight) / 2,
    )
    body.reset(x, y)
    body.setVelocityY(scrollSpeed)
  }

  setScrollSpeed(scrollSpeed: number): void {
    if (!this.active) return
    ;(this.body as Phaser.Physics.Arcade.Body).setVelocityY(scrollSpeed)
  }

  update(_time: number, delta: number): void {
    if (!this.active || !this.moves) return

    this.wobbleElapsed += delta
    const phase = (this.wobbleElapsed % DRONE_WOBBLE_PERIOD_MS) / DRONE_WOBBLE_PERIOD_MS
    this.x = this.wobbleOriginX + Math.sin(phase * Math.PI * 2) * DRONE_WOBBLE_AMPLITUDE
    ;(this.body as Phaser.Physics.Arcade.Body).updateFromGameObject()
  }

  deactivate(): void {
    this.setActive(false)
    this.setVisible(false)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
    body.reset(-200, -200)
  }
}
