import Phaser from 'phaser'
import { EventBus } from '@/game/EventBus'
import { Player } from '@/game/entities/Player'
import { LaneController } from '@/game/systems/LaneController'
import { InputManager } from '@/game/systems/InputManager'
import { ObstacleSpawner } from '@/game/systems/ObstacleSpawner'
import { CoinSpawner } from '@/game/systems/CoinSpawner'
import { CollisionSystem } from '@/game/systems/CollisionSystem'
import { ScoreManager } from '@/game/systems/ScoreManager'
import { ComboManager } from '@/game/systems/ComboManager'
import { NearMissSystem } from '@/game/systems/NearMissSystem'
import { getDifficultyAt } from '@/game/systems/DifficultyManager'
import { CHARACTERS } from '@/game/data/characters'
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '@/game/config/gameConfig'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private laneController!: LaneController
  private inputManager!: InputManager
  private obstacleSpawner!: ObstacleSpawner
  private coinSpawner!: CoinSpawner
  private collisionSystem!: CollisionSystem
  private scoreManager!: ScoreManager
  private comboManager!: ComboManager
  private nearMissSystem!: NearMissSystem
  private road!: Phaser.GameObjects.TileSprite
  private distance = 0
  private scrollSpeed = 0
  private isGameOver = false
  private highScoreAtStart = 0

  constructor() {
    super('Game')
  }

  create(): void {
    this.isGameOver = false
    this.distance = 0
    this.scrollSpeed = getDifficultyAt(0).scrollSpeed

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
    this.comboManager = new ComboManager()
    this.nearMissSystem = new NearMissSystem(this)

    this.inputManager = new InputManager(this, {
      onMoveLeft: () => this.laneController.moveLeft(),
      onMoveRight: () => this.laneController.moveRight(),
      onJump: () => this.player.jump(),
      onSlide: () => this.player.slide(),
      onPause: () => this.requestPause(),
    })

    const onPauseRequested = () => this.requestPause()
    const onResumeRequested = () => this.requestResume()
    const onRestartRequested = () => this.scene.restart()
    EventBus.on('pause-requested', onPauseRequested)
    EventBus.on('resume-requested', onResumeRequested)
    EventBus.on('restart-requested', onRestartRequested)

    EventBus.emit('game-ready')

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputManager.destroy()
      EventBus.off('pause-requested', onPauseRequested)
      EventBus.off('resume-requested', onResumeRequested)
      EventBus.off('restart-requested', onRestartRequested)
    })
  }

  private requestPause(): void {
    if (this.isGameOver || this.scene.isPaused()) return
    this.scene.pause()
    EventBus.emit('game-paused')
  }

  private requestResume(): void {
    if (!this.scene.isPaused()) return
    this.scene.resume()
    EventBus.emit('game-resumed')
  }

  update(time: number, delta: number): void {
    if (this.isGameOver) return

    const distanceDelta = (this.scrollSpeed * delta) / 1000
    this.distance += distanceDelta
    this.scoreManager.addDistance(distanceDelta)
    // The road's scroll also reads the physics world's timeScale so it visually
    // matches the brief slow-motion dip NearMissSystem applies to obstacle/coin
    // velocities - otherwise the background would keep scrolling at full speed while
    // everything physics-driven slows down around it.
    this.road.tilePositionY -= distanceDelta * this.physics.world.timeScale
    this.player.update(time, delta)

    const difficulty = getDifficultyAt(this.distance)
    this.scrollSpeed = difficulty.scrollSpeed

    this.obstacleSpawner.update(
      delta,
      distanceDelta,
      this.scrollSpeed,
      difficulty.patternTier,
      difficulty.obstacleGap,
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
      const combo = this.comboManager.registerPickup()
      this.scoreManager.addCoin(combo.multiplier)
      EventBus.emit('combo-changed', combo)
    }
    if (collectedCoins.length > 0) {
      EventBus.emit('coins-changed', this.scoreManager.getCoins())
    }

    const comboReset = this.comboManager.update(delta)
    if (comboReset) {
      EventBus.emit('combo-changed', comboReset)
    }

    if (this.nearMissSystem.check(this.player, this.obstacleSpawner.getActive())) {
      const bonus = this.scoreManager.addNearMissBonus()
      EventBus.emit('near-miss', { bonus })
    }

    EventBus.emit('score-changed', this.scoreManager.getScore())
    EventBus.emit('distance-changed', this.scoreManager.getDistanceMeters())
  }

  private handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    this.player.state = 'dead'
    this.comboManager.reset()

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
