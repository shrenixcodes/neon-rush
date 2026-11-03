import { GameCanvas } from '@/components/GameCanvas'
import { GameHUD } from '@/components/GameHUD/GameHUD'
import { PauseScreen } from '@/components/PauseScreen/PauseScreen'
import { GameOverScreen } from '@/components/GameOverScreen/GameOverScreen'
import { TouchControls } from '@/components/TouchControls/TouchControls'
import { useGameEvents } from '@/hooks/useGameEvents'
import type { GameMode } from '@/game/types/events'
import type { GhostEvent } from '@/game/types/replay'

interface PlayScreenProps {
  highScore: number
  characterId: string
  mode: GameMode
  dailyBest: number
  ghostEvents: GhostEvent[] | null
  quality: 'high' | 'low'
  onExit: () => void
}

export function PlayScreen({
  highScore,
  characterId,
  mode,
  dailyBest,
  ghostEvents,
  quality,
  onExit,
}: PlayScreenProps) {
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
      <GameCanvas
        highScore={highScore}
        characterId={characterId}
        mode={mode}
        dailyBest={dailyBest}
        ghostEvents={ghostEvents}
        quality={quality}
      />
      <GameHUD
        score={score}
        distance={distance}
        coins={coins}
        combo={combo}
        onPause={requestPause}
      />
      {!isPaused && !gameOver && <TouchControls />}
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
