import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import type { GameMode } from '@/game/types/events'
import type { GhostEvent } from '@/game/types/replay'

interface GameCanvasProps {
  highScore: number
  characterId: string
  mode: GameMode
  dailyBest: number
  ghostEvents: GhostEvent[] | null
  quality: 'high' | 'low'
}

export function GameCanvas({
  highScore,
  characterId,
  mode,
  dailyBest,
  ghostEvents,
  quality,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Captures the props as they were at mount time only. A new high score set
  // mid-session is written straight into the Phaser registry by GameScene rather
  // than flowing back through React, so the effect below intentionally never needs
  // to see a later value here.
  const initDataRef = useRef({ highScore, characterId, mode, dailyBest, ghostEvents, quality })

  useEffect(() => {
    let cancelled = false

    // Phaser is by far the largest dependency in this app and the main menu never
    // needs it - loading it on demand here, only once the player actually starts a
    // run, keeps the initial page load fast instead of shipping the whole engine
    // up front for a screen that never touches it.
    import('@/game/PhaserGame').then(({ createPhaserGame }) => {
      if (cancelled || !containerRef.current) return
      const game = createPhaserGame(containerRef.current, initDataRef.current)
      gameRef.current = game
      setIsLoading(false)

      if (import.meta.env.DEV) {
        ;(window as unknown as { __NEON_RUSH_GAME__?: Phaser.Game }).__NEON_RUSH_GAME__ = game
      }
    })

    return () => {
      cancelled = true
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className="flex min-h-svh items-center justify-center bg-ink-950">
      {isLoading && (
        <p className="font-display absolute animate-pulse text-sm tracking-widest text-neon-cyan/70 uppercase">
          Loading run...
        </p>
      )}
      <div ref={containerRef} className="h-svh w-full" />
    </div>
  )
}
