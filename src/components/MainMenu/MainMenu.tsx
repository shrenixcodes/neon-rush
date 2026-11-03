import { motion } from 'framer-motion'
import { audioManager } from '@/game/systems/AudioManager'
import type { Screen } from '@/types/screen'

interface MainMenuProps {
  highScore: number
  totalCoins: number
  dailyBest: number
  onNavigate: (screen: Screen) => void
  onPlay: () => void
  onPlayDaily: () => void
}

const menuItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.35, ease: 'easeOut' as const },
  }),
}

export function MainMenu({
  highScore,
  totalCoins,
  dailyBest,
  onNavigate,
  onPlay,
  onPlayDaily,
}: MainMenuProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ink-950 px-6 py-10 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(155,48,255,0.25),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10"
      >
        <h1 className="font-display text-glow-cyan text-5xl font-black tracking-widest text-neon-cyan sm:text-7xl">
          NEON
          <span className="text-glow-magenta text-neon-magenta"> RUSH</span>
        </h1>
        <p className="font-body mt-3 text-sm tracking-[0.3em] text-neon-purple/80 uppercase">
          Run. Dodge. Survive the city.
        </p>
      </motion.div>

      <div className="relative z-10 mt-10 flex w-full max-w-xs flex-col gap-3">
        {[
          { label: 'Play', action: onPlay, primary: true },
          { label: 'Daily Challenge', action: onPlayDaily },
          { label: 'Characters', action: () => onNavigate('character-select') },
          { label: 'How To Play', action: () => onNavigate('how-to-play') },
          { label: 'Settings', action: () => onNavigate('settings') },
        ].map((item, i) => (
          <motion.button
            key={item.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={menuItemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              audioManager.playUiClick()
              item.action()
            }}
            className={
              item.primary
                ? 'font-display rounded-md border border-neon-cyan/60 bg-neon-cyan/10 px-6 py-3 text-lg font-bold tracking-wider text-neon-cyan shadow-[0_0_20px_rgba(39,243,255,0.35)] transition-colors hover:bg-neon-cyan/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-cyan'
                : 'font-body rounded-md border border-ink-700 bg-ink-900/60 px-6 py-2.5 text-base font-semibold tracking-wide text-neon-purple/90 transition-colors hover:border-neon-purple/60 hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple'
            }
          >
            {item.label}
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="font-body relative z-10 mt-10 flex gap-8 text-sm text-neon-cyan/80"
      >
        <div className="flex flex-col items-center">
          <span className="text-xs tracking-widest text-white/50 uppercase">High Score</span>
          <span className="font-display text-xl font-bold text-white">
            {highScore.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs tracking-widest text-white/50 uppercase">Coins</span>
          <span className="font-display text-xl font-bold text-neon-yellow">
            {totalCoins.toLocaleString()}
          </span>
        </div>
        {dailyBest > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-xs tracking-widest text-white/50 uppercase">
              Today&apos;s Best
            </span>
            <span className="font-display text-xl font-bold text-neon-magenta">
              {dailyBest.toLocaleString()}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
}
