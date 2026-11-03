import { EventBus } from '@/game/EventBus'
import { audioManager } from '@/game/systems/AudioManager'
import type { GameEventName } from '@/game/types/events'

/**
 * Visible on-screen buttons, shown alongside swipe gestures rather than instead of
 * them (see InputManager for the swipe handling). Swiping is the primary touch
 * input; these buttons are the "optional visible" fallback for players who'd rather
 * tap. Only rendered on coarse-pointer (touch) devices via the `touch:` variant -
 * see index.css - so desktop players never see them.
 */
function TouchButton({ label, event }: { label: string; event: GameEventName }) {
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault()
        audioManager.playUiClick()
        EventBus.emit(event)
      }}
      aria-label={label}
      className="font-display pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-cyan/50 bg-ink-950/60 text-2xl text-neon-cyan backdrop-blur-sm active:bg-neon-cyan/20"
    >
      {label}
    </button>
  )
}

export function TouchControls() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden touch:flex touch:justify-between touch:px-6">
      <div className="pointer-events-auto flex gap-3">
        <TouchButton label="◀" event="touch-move-left" />
        <TouchButton label="▶" event="touch-move-right" />
      </div>
      <div className="pointer-events-auto flex gap-3">
        <TouchButton label="▼" event="touch-slide" />
        <TouchButton label="▲" event="touch-jump" />
      </div>
    </div>
  )
}
