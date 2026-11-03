import { useEffect, useState } from 'react'
import { EventBus } from '@/game/EventBus'
import type { ComboPayload } from '@/game/types/events'

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

  useEffect(() => {
    EventBus.on('score-changed', setScore)
    EventBus.on('distance-changed', setDistance)
    EventBus.on('coins-changed', setCoins)
    EventBus.on('combo-changed', setCombo)

    return () => {
      EventBus.off('score-changed', setScore)
      EventBus.off('distance-changed', setDistance)
      EventBus.off('coins-changed', setCoins)
      EventBus.off('combo-changed', setCombo)
    }
  }, [])

  return { score, distance, coins, combo }
}
