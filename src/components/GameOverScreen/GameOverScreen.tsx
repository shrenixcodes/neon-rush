import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { GameOverPayload } from '@/game/types/events'

interface GameOverScreenProps {
  result: GameOverPayload
  onRestart: () => void
  onMainMenu: () => void
}

const REVEAL_DURATION_MS = 700

/** Counts a number up from 0 to its target over a fixed duration, used for the final
 * score reveal. Falls back to showing the target immediately once the duration is
 * reached, so it never gets stuck mid-count if a frame is dropped. */
function useCountUp(target: number, durationMs: number): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      setValue(Math.round(target * progress))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

export function GameOverScreen({ result, onRestart, onMainMenu }: GameOverScreenProps) {
  const displayedScore = useCountUp(result.score, REVEAL_DURATION_MS)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-ink-950/90 backdrop-blur-sm"
    >
      <motion.h2
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="font-display text-glow-magenta text-3xl font-bold text-neon-magenta"
      >
        Run Over
      </motion.h2>

      {result.isNewHighScore && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="font-display rounded-full border border-neon-yellow/60 bg-neon-yellow/10 px-4 py-1 text-xs font-bold tracking-widest text-neon-yellow uppercase"
        >
          New High Score
        </motion.span>
      )}

      <div className="font-display text-glow-cyan text-5xl font-black text-neon-cyan">
        {displayedScore.toLocaleString()}
      </div>

      <div className="font-body flex gap-8 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xs tracking-widest text-white/50 uppercase">Distance</span>
          <span className="font-display text-lg font-bold text-white">{result.distance}m</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs tracking-widest text-white/50 uppercase">Coins</span>
          <span className="font-display text-lg font-bold text-neon-yellow">
            {result.coins.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex w-56 flex-col gap-3">
        <button
          onClick={onRestart}
          className="font-display rounded-md border border-neon-cyan/60 bg-neon-cyan/10 px-6 py-2.5 font-bold tracking-wide text-neon-cyan transition-colors hover:bg-neon-cyan/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-cyan"
        >
          Restart
        </button>
        <button
          onClick={onMainMenu}
          className="font-display rounded-md border border-ink-700 bg-ink-900/60 px-6 py-2.5 font-semibold tracking-wide text-white/80 transition-colors hover:border-neon-purple/60 hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
        >
          Main Menu
        </button>
      </div>
    </motion.div>
  )
}
