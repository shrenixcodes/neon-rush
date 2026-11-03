import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'
import { createPhaserGame } from '@/game/PhaserGame'

export function GameCanvas() {
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
    <div className="flex min-h-svh items-center justify-center bg-ink-950">
      <div ref={containerRef} className="h-svh w-full" />
    </div>
  )
}
