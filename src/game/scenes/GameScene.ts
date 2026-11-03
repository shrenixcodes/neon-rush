import Phaser from 'phaser'
import { EventBus } from '@/game/EventBus'
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameConfig'

export class GameScene extends Phaser.Scene {
  private road!: Phaser.GameObjects.TileSprite
  private scrollSpeed = 480

  constructor() {
    super('Game')
  }

  create(): void {
    this.road = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'road-tile')

    EventBus.emit('game-ready')
  }

  update(_time: number, delta: number): void {
    this.road.tilePositionY -= (this.scrollSpeed * delta) / 1000
  }
}
