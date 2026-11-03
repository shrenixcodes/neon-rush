import { GameCanvas } from '@/components/GameCanvas'
import { GameHUD } from '@/components/GameHUD/GameHUD'
import { PauseScreen } from '@/components/PauseScreen/PauseScreen'
import { useGameEvents } from '@/hooks/useGameEvents'

interface PlayScreenProps {
  onExit: () => void
}

export function PlayScreen({ onExit }: PlayScreenProps) {
  const { score, distance, coins, combo, isPaused, requestPause, requestResume, requestRestart } =
    useGameEvents()

  return (
    <div className="relative min-h-svh bg-ink-950">
      <GameCanvas />
      <GameHUD
        score={score}
        distance={distance}
        coins={coins}
        combo={combo}
        onPause={requestPause}
      />
      {isPaused && (
        <PauseScreen
          score={score}
          coins={coins}
          onResume={requestResume}
          onRestart={requestRestart}
          onMainMenu={onExit}
        />
      )}
    </div>
  )
}
