import Phaser from 'phaser'
import { EventBus } from '@/game/EventBus'
import { Player } from '@/game/entities/Player'
import { LaneController } from '@/game/systems/LaneController'
import { InputManager } from '@/game/systems/InputManager'
import { ObstacleSpawner } from '@/game/systems/ObstacleSpawner'
import { CoinSpawner } from '@/game/systems/CoinSpawner'
import { CollisionSystem } from '@/game/systems/CollisionSystem'
import { ScoreManager } from '@/game/systems/ScoreManager'
import { CHARACTERS } from '@/game/data/characters'
import { BASE_SCROLL_SPEED, GAME_HEIGHT, GAME_WIDTH, LANE_X } from '@/game/config/gameConfig'

const DEFAULT_PATTERN_TIER = 0
const DEFAULT_OBSTACLE_GAP = 620

export class GameScene extends Phaser.Scene {
  private player!: Player
  private laneController!: LaneController
  private inputManager!: InputManager
  private obstacleSpawner!: ObstacleSpawner
  private coinSpawner!: CoinSpawner
  private collisionSystem!: CollisionSystem
  private scoreManager!: ScoreManager
  private road!: Phaser.GameObjects.TileSprite
  private scrollSpeed = BASE_SCROLL_SPEED
  private isGameOver = false
  private highScoreAtStart = 0

  constructor() {
    super('Game')
  }

  create(): void {
    this.isGameOver = false

    this.road = this.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      'road-tile',
    )

    const character = CHARACTERS[0]
    this.player = new Player(this, LANE_X[1], character.palette)
    this.laneController = new LaneController(this, this.player)
    this.obstacleSpawner = new ObstacleSpawner(this)
    this.coinSpawner = new CoinSpawner(this)
    this.collisionSystem = new CollisionSystem(this)
    this.scoreManager = new ScoreManager()

    this.inputManager = new InputManager(this, {
      onMoveLeft: () => this.laneController.moveLeft(),
      onMoveRight: () => this.laneController.moveRight(),
      onJump: () => this.player.jump(),
      onSlide: () => this.player.slide(),
    })

    EventBus.emit('game-ready')

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputManager.destroy()
    })
  }

  update(time: number, delta: number): void {
    if (this.isGameOver) return

    const distanceDelta = (this.scrollSpeed * delta) / 1000
    this.scoreManager.addDistance(distanceDelta)
    this.road.tilePositionY -= distanceDelta
    this.player.update(time, delta)

    this.obstacleSpawner.update(
      delta,
      distanceDelta,
      this.scrollSpeed,
      DEFAULT_PATTERN_TIER,
      DEFAULT_OBSTACLE_GAP,
    )

    this.coinSpawner.update(
      delta,
      distanceDelta,
      this.scrollSpeed,
      this.obstacleSpawner.getActive(),
    )

    const hitObstacle = this.collisionSystem.checkObstacleHit(
      this.player,
      this.obstacleSpawner.getActive(),
    )
    if (hitObstacle) {
      this.handleGameOver()
      return
    }

    const collectedCoins = this.collisionSystem.checkCoinPickups(
      this.player,
      this.coinSpawner.getActive(),
    )
    for (const coin of collectedCoins) {
      this.coinSpawner.collect(coin)
      this.scoreManager.addCoin(1)
    }
    if (collectedCoins.length > 0) {
      EventBus.emit('coins-changed', this.scoreManager.getCoins())
    }

    EventBus.emit('score-changed', this.scoreManager.getScore())
    EventBus.emit('distance-changed', this.scoreManager.getDistanceMeters())
  }

  private handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    this.player.state = 'dead'

    const score = this.scoreManager.getScore()
    EventBus.emit('player-collided')
    EventBus.emit('game-over', {
      score,
      distance: this.scoreManager.getDistanceMeters(),
      coins: this.scoreManager.getCoins(),
      isNewHighScore: score > this.highScoreAtStart,
    })
  }
}
