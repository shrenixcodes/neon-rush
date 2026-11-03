import Phaser from 'phaser'
import { EventBus } from '@/game/EventBus'
import { Player } from '@/game/entities/Player'
import { CHARACTERS } from '@/game/data/characters'
import { BASE_SCROLL_SPEED, GAME_HEIGHT, GAME_WIDTH, LANE_X } from '@/game/config/gameConfig'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private road!: Phaser.GameObjects.TileSprite
  private scrollSpeed = BASE_SCROLL_SPEED

  constructor() {
    super('Game')
  }

  create(): void {
    this.road = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'road-tile')

    const character = CHARACTERS[0]
    this.player = new Player(this, LANE_X[1], character.palette)

    EventBus.emit('game-ready')
  }

  update(time: number, delta: number): void {
    this.road.tilePositionY -= (this.scrollSpeed * delta) / 1000
    this.player.update(time, delta)
  }
}
