import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'
import { createPhaserGame } from '@/game/PhaserGame'

interface GameCanvasProps {
  onExit: () => void
}

export function GameCanvas({ onExit }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const game = createPhaserGame(containerRef.current)
    gameRef.current = game

    if (import.meta.env.DEV) {
      ;(window as unknown as { __NEON_RUSH_GAME__?: Phaser.Game }).__NEON_RUSH_GAME__ = game
    }

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-ink-950">
      <div ref={containerRef} className="h-svh w-full" />
      <button
        onClick={onExit}
        className="font-display absolute top-4 left-4 z-10 rounded-md border border-neon-purple/50 bg-ink-950/70 px-3 py-1.5 text-xs font-bold tracking-wide text-neon-purple/90 backdrop-blur-sm transition-colors hover:bg-ink-900"
      >
        Exit
      </button>
    </div>
  )
}
