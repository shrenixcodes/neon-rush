import { motion } from 'framer-motion'

interface PauseScreenProps {
  score: number
  coins: number
  onResume: () => void
  onRestart: () => void
  onMainMenu: () => void
}

export function PauseScreen({ score, coins, onResume, onRestart, onMainMenu }: PauseScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-ink-950/85 backdrop-blur-sm"
    >
      <h2 className="font-display text-glow-cyan text-3xl font-bold text-neon-cyan">Paused</h2>

      <div className="font-body flex gap-8 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xs tracking-widest text-white/50 uppercase">Score</span>
          <span className="font-display text-xl font-bold text-white">
            {score.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs tracking-widest text-white/50 uppercase">Coins</span>
          <span className="font-display text-xl font-bold text-neon-yellow">
            {coins.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex w-56 flex-col gap-3">
        <button
          onClick={onResume}
          className="font-display rounded-md border border-neon-cyan/60 bg-neon-cyan/10 px-6 py-2.5 font-bold tracking-wide text-neon-cyan transition-colors hover:bg-neon-cyan/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-cyan"
        >
          Resume
        </button>
        <button
          onClick={onRestart}
          className="font-display rounded-md border border-ink-700 bg-ink-900/60 px-6 py-2.5 font-semibold tracking-wide text-white transition-colors hover:border-neon-purple/60 hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
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
