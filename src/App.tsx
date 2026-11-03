import { useState } from 'react'
import { motion } from 'framer-motion'
import { MainMenu } from '@/components/MainMenu/MainMenu'
import { CharacterSelect } from '@/components/CharacterSelect/CharacterSelect'
import { HowToPlay } from '@/components/HowToPlay/HowToPlay'
import { Settings } from '@/components/Settings/Settings'
import { GameCanvas } from '@/components/GameCanvas'
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/game/data/characters'
import { DEFAULT_SETTINGS } from '@/types/settings'
import type { GameSettings } from '@/types/settings'
import type { Screen } from '@/types/screen'

const fadeTransition = { duration: 0.25, ease: 'easeInOut' as const }

export default function App() {
  const [screen, setScreen] = useState<Screen>('main-menu')
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)

  // Progression state below is temporary local state. It will move to the
  // persistent save store once the storage service is in place.
  const [highScore] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [unlockedIds, setUnlockedIds] = useState<string[]>([DEFAULT_CHARACTER_ID])
  const [selectedId, setSelectedId] = useState(DEFAULT_CHARACTER_ID)

  const handleUnlock = (id: string) => {
    const character = CHARACTERS.find((c) => c.id === id)
    if (!character || unlockedIds.includes(id) || totalCoins < character.unlockCost) return
    setTotalCoins((coins) => coins - character.unlockCost)
    setUnlockedIds((ids) => [...ids, id])
  }

  return (
    <>
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={fadeTransition}
      >
        {screen === 'main-menu' && (
          <MainMenu
            highScore={highScore}
            totalCoins={totalCoins}
            onNavigate={setScreen}
            onPlay={() => setScreen('playing')}
          />
        )}
        {screen === 'character-select' && (
          <CharacterSelect
            unlockedIds={unlockedIds}
            selectedId={selectedId}
            totalCoins={totalCoins}
            onSelect={setSelectedId}
            onUnlock={handleUnlock}
            onBack={() => setScreen('main-menu')}
          />
        )}
        {screen === 'how-to-play' && <HowToPlay onBack={() => setScreen('main-menu')} />}
        {screen === 'settings' && (
          <Settings
            settings={settings}
            onChange={setSettings}
            onBack={() => setScreen('main-menu')}
          />
        )}
        {screen === 'playing' && <GameCanvas onExit={() => setScreen('main-menu')} />}
      </motion.div>
    </>
  )
}
