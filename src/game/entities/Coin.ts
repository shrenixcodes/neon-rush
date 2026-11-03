import Phaser from 'phaser'

const SPIN_PERIOD_MS = 700
const COIN_SIZE = 56
const COIN_HITBOX = 46

/** A single pooled coin, reused via spawn()/deactivate() for the same reason as
 * Obstacle - coins are the highest-frequency spawn in the game. */
export class Coin extends Phaser.Physics.Arcade.Sprite {
  collected = false

  private spinElapsed = 0

  constructor(scene: Phaser.Scene) {
    super(scene, -200, -200, 'coin')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setActive(false)
    this.setVisible(false)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setSize(COIN_HITBOX, COIN_HITBOX)
    body.setOffset((COIN_SIZE - COIN_HITBOX) / 2, (COIN_SIZE - COIN_HITBOX) / 2)
  }

  spawn(x: number, y: number, scrollSpeed: number): void {
    this.collected = false
    this.spinElapsed = Math.random() * SPIN_PERIOD_MS
    this.setPosition(x, y)
    this.setScale(1)
    this.setAlpha(1)
    this.setActive(true)
    this.setVisible(true)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.reset(x, y)
    body.setVelocityY(scrollSpeed)
  }

  setScrollSpeed(scrollSpeed: number): void {
    if (!this.active) return
    ;(this.body as Phaser.Physics.Arcade.Body).setVelocityY(scrollSpeed)
  }

  update(_time: number, delta: number): void {
    if (!this.active) return
    this.spinElapsed += delta
    const phase = (this.spinElapsed % SPIN_PERIOD_MS) / SPIN_PERIOD_MS
    // A cheap "spin" illusion without a sprite sheet: squash horizontally through a
    // full cycle, like a coin rotating edge-on partway through.
    this.scaleX = Math.cos(phase * Math.PI * 2) * 0.5 + 0.5 + 0.1
  }

  deactivate(): void {
    this.setActive(false)
    this.setVisible(false)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
    body.reset(-200, -200)
  }
}
