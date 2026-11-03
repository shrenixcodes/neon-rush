import { GameCanvas } from '@/components/GameCanvas'
import { GameHUD } from '@/components/GameHUD/GameHUD'
import { PauseScreen } from '@/components/PauseScreen/PauseScreen'
import { GameOverScreen } from '@/components/GameOverScreen/GameOverScreen'
import { useGameEvents } from '@/hooks/useGameEvents'

interface PlayScreenProps {
  highScore: number
  characterId: string
  onExit: () => void
}

export function PlayScreen({ highScore, characterId, onExit }: PlayScreenProps) {
  const {
    score,
    distance,
    coins,
    combo,
    isPaused,
    gameOver,
    requestPause,
    requestResume,
    requestRestart,
  } = useGameEvents()

  return (
    <div className="relative min-h-svh bg-ink-950">
      <GameCanvas highScore={highScore} characterId={characterId} />
      <GameHUD
        score={score}
        distance={distance}
        coins={coins}
        combo={combo}
        onPause={requestPause}
      />
      {isPaused && !gameOver && (
        <PauseScreen
          score={score}
          coins={coins}
          onResume={requestResume}
          onRestart={requestRestart}
          onMainMenu={onExit}
        />
      )}
      {gameOver && (
        <GameOverScreen result={gameOver} onRestart={requestRestart} onMainMenu={onExit} />
      )}
    </div>
  )
}
