import Phaser from 'phaser'
import { EventBus } from '@/game/EventBus'
import { Player } from '@/game/entities/Player'
import { LaneController } from '@/game/systems/LaneController'
import { InputManager } from '@/game/systems/InputManager'
import { CHARACTERS } from '@/game/data/characters'
import { BASE_SCROLL_SPEED, GAME_HEIGHT, GAME_WIDTH, LANE_X } from '@/game/config/gameConfig'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private laneController!: LaneController
  private inputManager!: InputManager
  private road!: Phaser.GameObjects.TileSprite
  private scrollSpeed = BASE_SCROLL_SPEED

  constructor() {
    super('Game')
  }

  create(): void {
    this.road = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'road-tile')

    const character = CHARACTERS[0]
    this.player = new Player(this, LANE_X[1], character.palette)
    this.laneController = new LaneController(this, this.player)

    this.inputManager = new InputManager(this, {
      onMoveLeft: () => this.laneController.moveLeft(),
      onMoveRight: () => this.laneController.moveRight(),
    })

    EventBus.emit('game-ready')

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputManager.destroy()
    })
  }

  update(time: number, delta: number): void {
    this.road.tilePositionY -= (this.scrollSpeed * delta) / 1000
    this.player.update(time, delta)
  }
}
