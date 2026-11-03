import Phaser from 'phaser'
import type { CharacterPalette } from '@/game/data/characters'
import { PLAYER_HEIGHT, PLAYER_ROW_Y, PLAYER_WIDTH } from '@/game/config/gameConfig'

export type PlayerState = 'running' | 'jumping' | 'sliding' | 'colliding' | 'dead'

const RUN_CYCLE_MS = 300
const LEG_SWING_DEG = 28
const ARM_SWING_DEG = 22

/**
 * The runner is built entirely from Graphics primitives rather than imported sprite
 * sheets, so every character palette is just a recolor of the same rigged silhouette.
 * A basic procedural run cycle (alternating limb rotation + torso bob) stands in for
 * frame-by-frame sprite animation.
 */
export class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body

  state: PlayerState = 'running'
  laneIndex = 1

  private torso: Phaser.GameObjects.Rectangle
  private head: Phaser.GameObjects.Arc
  private visor: Phaser.GameObjects.Rectangle
  private armLeft: Phaser.GameObjects.Rectangle
  private armRight: Phaser.GameObjects.Rectangle
  private legLeft: Phaser.GameObjects.Rectangle
  private legRight: Phaser.GameObjects.Rectangle
  private glow: Phaser.GameObjects.Arc

  private runClock = 0

  constructor(scene: Phaser.Scene, x: number, palette: CharacterPalette) {
    super(scene, x, PLAYER_ROW_Y)

    this.glow = scene.add.circle(
      0,
      -PLAYER_HEIGHT * 0.35,
      PLAYER_WIDTH * 0.9,
      Number(`0x${palette.glow.slice(1)}`),
      0.18,
    )
    this.legLeft = scene.add.rectangle(-14, 36, 16, 56, Number(`0x${palette.secondary.slice(1)}`))
    this.legRight = scene.add.rectangle(14, 36, 16, 56, Number(`0x${palette.secondary.slice(1)}`))
    this.armLeft = scene.add.rectangle(-30, -8, 12, 46, Number(`0x${palette.primary.slice(1)}`))
    this.armRight = scene.add.rectangle(30, -8, 12, 46, Number(`0x${palette.primary.slice(1)}`))
    this.torso = scene.add.rectangle(0, -20, 44, 60, Number(`0x${palette.secondary.slice(1)}`))
    this.torso.setStrokeStyle(3, Number(`0x${palette.primary.slice(1)}`))
    this.head = scene.add.circle(0, -62, 20, Number(`0x${palette.secondary.slice(1)}`))
    this.head.setStrokeStyle(3, Number(`0x${palette.primary.slice(1)}`))
    this.visor = scene.add.rectangle(0, -64, 26, 9, Number(`0x${palette.visor.slice(1)}`), 0.95)

    this.legLeft.setOrigin(0.5, 0)
    this.legRight.setOrigin(0.5, 0)
    this.armLeft.setOrigin(0.5, 0)
    this.armRight.setOrigin(0.5, 0)

    this.add([
      this.glow,
      this.legLeft,
      this.legRight,
      this.torso,
      this.armLeft,
      this.armRight,
      this.head,
      this.visor,
    ])

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT)
    this.body.setOffset(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT)
    this.body.setCollideWorldBounds(false)
    this.body.setGravityY(0)
  }

  update(_time: number, delta: number): void {
    this.runClock += delta
    this.updateRunCycle()
  }

  private updateRunCycle(): void {
    const phase = (this.runClock % RUN_CYCLE_MS) / RUN_CYCLE_MS
    const swing = Math.sin(phase * Math.PI * 2)
    this.legLeft.rotation = Phaser.Math.DegToRad(swing * LEG_SWING_DEG)
    this.legRight.rotation = Phaser.Math.DegToRad(-swing * LEG_SWING_DEG)
    this.armRight.rotation = Phaser.Math.DegToRad(swing * ARM_SWING_DEG)
    this.armLeft.rotation = Phaser.Math.DegToRad(-swing * ARM_SWING_DEG)

    const bob = Math.abs(swing) * 4
    this.torso.y = -20 - bob
    this.head.y = -62 - bob
    this.visor.y = -64 - bob
  }
}
