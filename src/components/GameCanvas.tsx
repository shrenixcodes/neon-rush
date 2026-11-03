import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'
import { createPhaserGame } from '@/game/PhaserGame'

interface GameCanvasProps {
  highScore: number
  characterId: string
}

export function GameCanvas({ highScore, characterId }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  // Captures the props as they were at mount time only. A new high score set
  // mid-session is written straight into the Phaser registry by GameScene rather
  // than flowing back through React, so the effect below intentionally never needs
  // to see a later value here.
  const initDataRef = useRef({ highScore, characterId })

  useEffect(() => {
    if (!containerRef.current) return

    const game = createPhaserGame(containerRef.current, initDataRef.current)
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
