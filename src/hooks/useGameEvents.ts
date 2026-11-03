import { useEffect, useState } from 'react'
import { EventBus } from '@/game/EventBus'
import type { ComboPayload, GameOverPayload } from '@/game/types/events'

const DEFAULT_COMBO: ComboPayload = { multiplier: 1, streak: 0 }

/**
 * The single bridge between Phaser's EventBus and React state for the gameplay
 * screen. Gameplay itself never touches React state directly (Player, spawners,
 * etc. only emit through EventBus), which is what keeps the 60fps simulation loop
 * free of React re-renders - only this hook's consumers re-render, and only when one
 * of these specific values actually changes.
 */
export function useGameEvents() {
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)
  const [coins, setCoins] = useState(0)
  const [combo, setCombo] = useState<ComboPayload>(DEFAULT_COMBO)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState<GameOverPayload | null>(null)

  useEffect(() => {
    const onPaused = () => setIsPaused(true)
    const onResumed = () => setIsPaused(false)
    const onGameOver = (payload: GameOverPayload) => setGameOver(payload)

    EventBus.on('score-changed', setScore)
    EventBus.on('distance-changed', setDistance)
    EventBus.on('coins-changed', setCoins)
    EventBus.on('combo-changed', setCombo)
    EventBus.on('game-paused', onPaused)
    EventBus.on('game-resumed', onResumed)
    EventBus.on('game-over', onGameOver)

    return () => {
      EventBus.off('score-changed', setScore)
      EventBus.off('distance-changed', setDistance)
      EventBus.off('coins-changed', setCoins)
      EventBus.off('combo-changed', setCombo)
      EventBus.off('game-paused', onPaused)
      EventBus.off('game-resumed', onResumed)
      EventBus.off('game-over', onGameOver)
    }
  }, [])

  const requestPause = () => EventBus.emit('pause-requested')
  const requestResume = () => EventBus.emit('resume-requested')
  const requestRestart = () => {
    setGameOver(null)
    setIsPaused(false)
    setScore(0)
    setDistance(0)
    setCoins(0)
    setCombo(DEFAULT_COMBO)
    EventBus.emit('restart-requested')
  }

  return {
    score,
    distance,
    coins,
    combo,
    isPaused,
    gameOver,
    requestPause,
    requestResume,
    requestRestart,
  }
}
