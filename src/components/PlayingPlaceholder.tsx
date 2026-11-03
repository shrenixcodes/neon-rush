interface PlayingPlaceholderProps {
  onExit: () => void
}

// Temporary stand-in for the gameplay screen. Replaced by the Phaser canvas and HUD
// once the core game scene is in place.
export function PlayingPlaceholder({ onExit }: PlayingPlaceholderProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-ink-950 px-6 text-center">
      <p className="font-display animate-pulse text-xl text-neon-cyan">Booting runner systems...</p>
      <button
        onClick={onExit}
        className="font-display rounded-md border border-neon-purple/60 bg-ink-900/60 px-6 py-2.5 font-bold tracking-wide text-neon-purple transition-colors hover:bg-ink-800"
      >
        Back to Menu
      </button>
    </div>
  )
}
