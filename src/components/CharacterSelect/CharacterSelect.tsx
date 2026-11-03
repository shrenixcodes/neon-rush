import { CHARACTERS } from '@/game/data/characters'
import { CharacterPreview } from './CharacterPreview'

interface CharacterSelectProps {
  unlockedIds: string[]
  selectedId: string
  totalCoins: number
  onSelect: (id: string) => void
  onUnlock: (id: string) => void
  onBack: () => void
}

export function CharacterSelect({
  unlockedIds,
  selectedId,
  totalCoins,
  onSelect,
  onUnlock,
  onBack,
}: CharacterSelectProps) {
  return (
    <div className="flex min-h-svh flex-col items-center bg-ink-950 px-6 py-10">
      <h2 className="font-display text-glow-cyan text-3xl font-bold text-neon-cyan">Characters</h2>
      <p className="font-body mt-1 text-sm text-white/60">
        Coins: <span className="text-neon-yellow">{totalCoins.toLocaleString()}</span> — unlocks are
        cosmetic only
      </p>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {CHARACTERS.map((character) => {
          const unlocked = unlockedIds.includes(character.id)
          const selected = selectedId === character.id
          const affordable = totalCoins >= character.unlockCost

          return (
            <div
              key={character.id}
              className={`font-body flex flex-col items-center rounded-lg border p-4 transition-colors ${
                selected ? 'border-neon-cyan bg-neon-cyan/10' : 'border-ink-700 bg-ink-900/40'
              }`}
            >
              <CharacterPreview palette={character.palette} locked={!unlocked} />
              <span className="font-display mt-2 text-sm font-bold text-white">
                {character.name}
              </span>
              <span className="mt-1 h-10 text-center text-xs text-white/50">
                {character.tagline}
              </span>

              {unlocked ? (
                <button
                  onClick={() => onSelect(character.id)}
                  disabled={selected}
                  className={`font-display mt-3 w-full rounded px-3 py-1.5 text-xs font-bold tracking-wide transition-colors ${
                    selected
                      ? 'cursor-default bg-neon-cyan/20 text-neon-cyan'
                      : 'bg-ink-800 text-white hover:bg-ink-700'
                  }`}
                >
                  {selected ? 'Selected' : 'Select'}
                </button>
              ) : (
                <button
                  onClick={() => onUnlock(character.id)}
                  disabled={!affordable}
                  className={`font-display mt-3 w-full rounded px-3 py-1.5 text-xs font-bold tracking-wide transition-colors ${
                    affordable
                      ? 'bg-neon-yellow/90 text-ink-950 hover:bg-neon-yellow'
                      : 'cursor-not-allowed bg-ink-800 text-white/40'
                  }`}
                >
                  Unlock — {character.unlockCost}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onBack}
        className="font-display mt-10 rounded-md border border-neon-purple/60 bg-ink-900/60 px-6 py-2.5 font-bold tracking-wide text-neon-purple transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-purple"
      >
        Back
      </button>
    </div>
  )
}
