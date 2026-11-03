import Phaser from 'phaser'
import { ENVIRONMENTS } from '@/game/data/environments'
import type { EnvironmentDefinition } from '@/game/data/environments'
import { GAME_HEIGHT, GAME_WIDTH, ROAD_MARGIN } from '@/game/config/gameConfig'

/** How far (in world pixels travelled) each city section lasts before cycling to
 * the next. Cycling rather than stopping after 4 means a long endless run keeps
 * seeing environment variety instead of settling on the last one forever. */
const SEGMENT_LENGTH = 7000
const SKY_CROSSFADE_MS = 700

const FAR_SPEED_FACTOR = 0.35
const NEAR_SPEED_FACTOR = 0.75

function getEnvironmentIndexAt(distance: number): number {
  return Math.floor(distance / SEGMENT_LENGTH) % ENVIRONMENTS.length
}

/**
 * Renders the scrolling city skyline in the margins on either side of the road,
 * plus a sky gradient behind everything. Two layers per side (far/near) scroll at
 * different fractions of the road's speed, which is what sells the depth illusion
 * with nothing more than flat Graphics-generated textures.
 *
 * The sky gradient crossfades between environments since it's the single largest
 * visual element and the crossfade is cheap (two Graphics rectangles). The narrow
 * skyline strips swap instantly instead - at ROAD_MARGIN px wide, a fade there
 * wouldn't read as a transition anyway, so the extra complexity isn't worth it.
 */
export class ParallaxBackground {
  private readonly scene: Phaser.Scene
  private skyPrimary: Phaser.GameObjects.Graphics
  private skyIncoming: Phaser.GameObjects.Graphics
  private leftFar: Phaser.GameObjects.TileSprite
  private leftNear: Phaser.GameObjects.TileSprite
  private rightFar: Phaser.GameObjects.TileSprite
  private rightNear: Phaser.GameObjects.TileSprite
  private environmentIndex = -1
  private isTransitioning = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    this.skyPrimary = scene.add.graphics().setDepth(-20)
    this.skyIncoming = scene.add.graphics().setDepth(-20).setAlpha(0)

    this.leftFar = this.createStrip(ROAD_MARGIN / 2, -10)
    this.leftNear = this.createStrip(ROAD_MARGIN / 2, -9)
    this.rightFar = this.createStrip(GAME_WIDTH - ROAD_MARGIN / 2, -10)
    this.rightNear = this.createStrip(GAME_WIDTH - ROAD_MARGIN / 2, -9)

    this.applyEnvironment(getEnvironmentIndexAt(0))
  }

  private createStrip(x: number, depth: number): Phaser.GameObjects.TileSprite {
    return this.scene.add
      .tileSprite(x, GAME_HEIGHT / 2, ROAD_MARGIN, GAME_HEIGHT, 'skyline-neon-downtown-far')
      .setDepth(depth)
  }

  update(delta: number, scrollSpeed: number, distance: number): void {
    const farDelta = (scrollSpeed * FAR_SPEED_FACTOR * delta) / 1000
    const nearDelta = (scrollSpeed * NEAR_SPEED_FACTOR * delta) / 1000
    this.leftFar.tilePositionY -= farDelta
    this.rightFar.tilePositionY -= farDelta
    this.leftNear.tilePositionY -= nearDelta
    this.rightNear.tilePositionY -= nearDelta

    const targetIndex = getEnvironmentIndexAt(distance)
    if (targetIndex !== this.environmentIndex && !this.isTransitioning) {
      this.transitionTo(targetIndex)
    }
  }

  private transitionTo(index: number): void {
    this.isTransitioning = true
    const env = ENVIRONMENTS[index]

    this.leftFar.setTexture(`skyline-${env.id}-far`)
    this.rightFar.setTexture(`skyline-${env.id}-far`)
    this.leftNear.setTexture(`skyline-${env.id}-near`)
    this.rightNear.setTexture(`skyline-${env.id}-near`)

    this.drawSky(this.skyIncoming, env)
    this.scene.tweens.add({
      targets: this.skyIncoming,
      alpha: 1,
      duration: SKY_CROSSFADE_MS,
      onComplete: () => {
        ;[this.skyPrimary, this.skyIncoming] = [this.skyIncoming, this.skyPrimary]
        this.skyIncoming.setAlpha(0)
        this.environmentIndex = index
        this.isTransitioning = false
      },
    })
  }

  private applyEnvironment(index: number): void {
    const env = ENVIRONMENTS[index]
    this.environmentIndex = index
    this.drawSky(this.skyPrimary, env)
    this.leftFar.setTexture(`skyline-${env.id}-far`)
    this.rightFar.setTexture(`skyline-${env.id}-far`)
    this.leftNear.setTexture(`skyline-${env.id}-near`)
    this.rightNear.setTexture(`skyline-${env.id}-near`)
  }

  private drawSky(g: Phaser.GameObjects.Graphics, env: EnvironmentDefinition): void {
    g.clear()
    g.fillGradientStyle(env.skyTop, env.skyTop, env.skyBottom, env.skyBottom, 1)
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }
}
