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
import { ReplayRecorder } from '@/game/systems/ReplayRecorder'
import { GhostRunner } from '@/game/entities/GhostRunner'
import { audioManager } from '@/game/systems/AudioManager'
import { ParallaxBackground } from '@/game/systems/ParallaxBackground'
import { getDifficultyAt } from '@/game/systems/DifficultyManager'
import { createDailyChallengeRng } from '@/game/data/dailyChallenge'
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/game/data/characters'
import { GAME_HEIGHT, GAME_WIDTH, LANE_X, ROAD_WIDTH } from '@/game/config/gameConfig'
import type { GameMode } from '@/game/types/events'
import type { GhostEvent } from '@/game/types/replay'

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
  private replayRecorder!: ReplayRecorder
  private ghostRunner: GhostRunner | null = null
  private parallaxBackground!: ParallaxBackground
  private road!: Phaser.GameObjects.TileSprite
  private distance = 0
  private scrollSpeed = 0
  private isGameOver = false
  private highScoreAtStart = 0
  private dailyBestAtStart = 0
  private mode: GameMode = 'endless'
  private lowQuality = false

  constructor() {
    super('Game')
  }

  create(): void {
    this.isGameOver = false
    this.distance = 0
    this.scrollSpeed = getDifficultyAt(0).scrollSpeed
    this.highScoreAtStart = (this.registry.get('highScore') as number | undefined) ?? 0
    this.dailyBestAtStart = (this.registry.get('dailyBest') as number | undefined) ?? 0
    this.mode = (this.registry.get('mode') as GameMode | undefined) ?? 'endless'
    this.lowQuality = (this.registry.get('quality') as string | undefined) === 'low'

    this.parallaxBackground = new ParallaxBackground(this, this.lowQuality)

    this.road = this.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      ROAD_WIDTH,
      GAME_HEIGHT,
      'road-tile',
    )

    const characterId =
      (this.registry.get('characterId') as string | undefined) ?? DEFAULT_CHARACTER_ID
    const character = CHARACTERS.find((c) => c.id === characterId) ?? CHARACTERS[0]
    this.player = new Player(this, LANE_X[1], character.palette)
    this.player.setLowQuality(this.lowQuality)
    this.replayRecorder = new ReplayRecorder()
    this.laneController = new LaneController(this, this.player, (lane) =>
      this.replayRecorder.recordLaneChange(this.distance, lane),
    )

    const ghostEvents = this.registry.get('ghostEvents') as GhostEvent[] | null | undefined
    this.ghostRunner =
      ghostEvents && ghostEvents.length > 0
        ? new GhostRunner(this, ghostEvents, character.palette)
        : null
    this.ghostRunner?.player.setLowQuality(this.lowQuality)

    // A daily challenge run draws its obstacle/coin sequence from a seed derived from
    // today's date, so every player sees the same layout; an endless run stays on
    // Math.random (ObstacleSpawner/CoinSpawner's default) for genuine variety.
    const rng = this.mode === 'daily' ? createDailyChallengeRng() : undefined
    this.obstacleSpawner = new ObstacleSpawner(this, rng)
    this.coinSpawner = new CoinSpawner(this, rng)

    this.collisionSystem = new CollisionSystem(this)
    this.scoreManager = new ScoreManager()
    this.comboManager = new ComboManager()
    this.nearMissSystem = new NearMissSystem(this, this.lowQuality)

    this.inputManager = new InputManager(this, {
      onMoveLeft: () => this.handleMoveLeft(),
      onMoveRight: () => this.handleMoveRight(),
      onJump: () => this.handleJump(),
      onSlide: () => this.handleSlide(),
      onPause: () => this.requestPause(),
    })

    // The on-screen touch buttons (TouchControls, rendered by React) call into the
    // exact same handlers below via these events, rather than duplicating the
    // recording/audio side effects that go with each action.
    const onPauseRequested = () => this.requestPause()
    const onResumeRequested = () => this.requestResume()
    const onRestartRequested = () => this.scene.restart()
    const onTouchMoveLeft = () => this.handleMoveLeft()
    const onTouchMoveRight = () => this.handleMoveRight()
    const onTouchJump = () => this.handleJump()
    const onTouchSlide = () => this.handleSlide()
    EventBus.on('pause-requested', onPauseRequested)
    EventBus.on('resume-requested', onResumeRequested)
    EventBus.on('restart-requested', onRestartRequested)
    EventBus.on('touch-move-left', onTouchMoveLeft)
    EventBus.on('touch-move-right', onTouchMoveRight)
    EventBus.on('touch-jump', onTouchJump)
    EventBus.on('touch-slide', onTouchSlide)

    EventBus.emit('game-ready')

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputManager.destroy()
      this.ghostRunner?.destroy()
      EventBus.off('pause-requested', onPauseRequested)
      EventBus.off('resume-requested', onResumeRequested)
      EventBus.off('restart-requested', onRestartRequested)
      EventBus.off('touch-move-left', onTouchMoveLeft)
      EventBus.off('touch-move-right', onTouchMoveRight)
      EventBus.off('touch-jump', onTouchJump)
      EventBus.off('touch-slide', onTouchSlide)
    })
  }

  private handleMoveLeft(): void {
    this.laneController.moveLeft()
  }

  private handleMoveRight(): void {
    this.laneController.moveRight()
  }

  private handleJump(): void {
    if (this.player.jump()) {
      this.replayRecorder.recordJump(this.distance)
      audioManager.playJump()
    }
  }

  private handleSlide(): void {
    if (this.player.slide()) {
      this.replayRecorder.recordSlide(this.distance)
      audioManager.playSlide()
    }
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
    this.parallaxBackground.update(
      delta * this.physics.world.timeScale,
      this.scrollSpeed,
      this.distance,
    )
    this.player.update(time, delta)
    this.ghostRunner?.update(time, delta, this.distance)

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
      audioManager.playCoin()
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
      audioManager.playNearMiss()
    }

    EventBus.emit('score-changed', this.scoreManager.getScore())
    EventBus.emit('distance-changed', this.scoreManager.getDistanceMeters())
  }

  private handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    this.player.state = 'dead'
    this.comboManager.reset()
    audioManager.playCollision()
    window.setTimeout(() => audioManager.playGameOver(), 250)

    if (!this.lowQuality && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.cameras.main.shake(180, 0.012)
    }

    const score = this.scoreManager.getScore()
    const isNewHighScore = this.mode === 'endless' && score > this.highScoreAtStart
    const isNewDailyBest = this.mode === 'daily' && score > this.dailyBestAtStart

    if (isNewHighScore) {
      // Kept in the registry (shared across the whole Game instance) rather than
      // only on this scene, so a Restart without leaving the Playing screen still
      // compares the next run against the score that was just set, not a stale value.
      this.registry.set('highScore', score)
    }
    if (isNewDailyBest) {
      this.registry.set('dailyBest', score)
    }

    EventBus.emit('player-collided')
    EventBus.emit('game-over', {
      score,
      distance: this.scoreManager.getDistanceMeters(),
      coins: this.scoreManager.getCoins(),
      mode: this.mode,
      isNewHighScore,
      isNewDailyBest,
      ghostEvents: isNewHighScore ? this.replayRecorder.getEvents() : undefined,
    })
  }
}
