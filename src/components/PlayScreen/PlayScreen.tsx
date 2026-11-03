import { GameCanvas } from '@/components/GameCanvas'
import { GameHUD } from '@/components/GameHUD/GameHUD'
import { useGameEvents } from '@/hooks/useGameEvents'

export function PlayScreen() {
  const { score, distance, coins, combo } = useGameEvents()

  return (
    <div className="relative min-h-svh bg-ink-950">
      <GameCanvas />
      <GameHUD score={score} distance={distance} coins={coins} combo={combo} />
    </div>
  )
}
