import type { ComboPayload } from '@/game/types/events'

interface GameHUDProps {
  score: number
  distance: number
  coins: number
  combo: ComboPayload
  onPause: () => void
}

export function GameHUD({ score, distance, coins, combo, onPause }: GameHUDProps) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
      <div className="font-display pointer-events-none flex flex-col text-left leading-tight">
        <span className="text-glow-cyan text-2xl font-bold text-neon-cyan">
          {score.toLocaleString()}
        </span>
        <span className="font-body text-xs tracking-wide text-white/60">{distance}m</span>
        {combo.multiplier > 1 && (
          <span className="font-body mt-1 text-xs font-bold text-neon-magenta">
            Combo x{combo.multiplier}
          </span>
        )}
      </div>

      <button
        onClick={onPause}
        aria-label="Pause"
        className="font-display pointer-events-auto rounded-md border border-ink-700 bg-ink-900/60 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-colors hover:border-neon-purple/60 hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
      >
        ❙❙
      </button>

      <div className="font-display pointer-events-none flex items-center gap-1.5 text-xl font-bold text-neon-yellow">
        <span>{coins.toLocaleString()}</span>
        <span aria-hidden="true">●</span>
      </div>
    </div>
  )
}
