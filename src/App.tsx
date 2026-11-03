import { useEffect, useState } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import { MainMenu } from '@/components/MainMenu/MainMenu'
import { CharacterSelect } from '@/components/CharacterSelect/CharacterSelect'
import { HowToPlay } from '@/components/HowToPlay/HowToPlay'
import { Settings } from '@/components/Settings/Settings'
import { PlayScreen } from '@/components/PlayScreen/PlayScreen'
import { EventBus } from '@/game/EventBus'
import { audioManager } from '@/game/systems/AudioManager'
import { CHARACTERS } from '@/game/data/characters'
import { getDailyChallengeKey } from '@/game/data/dailyChallenge'
import { useSaveData } from '@/hooks/useSaveData'
import { usePersistentState } from '@/hooks/usePersistentState'
import { DEFAULT_SETTINGS } from '@/types/settings'
import type { GameMode, GameOverPayload } from '@/game/types/events'
import type { Screen } from '@/types/screen'

const fadeTransition = { duration: 0.25, ease: 'easeInOut' as const }

export default function App() {
  const [screen, setScreen] = useState<Screen>('main-menu')
  const [playMode, setPlayMode] = useState<GameMode>('endless')
  const [settings, setSettings] = usePersistentState('neon-rush-settings', DEFAULT_SETTINGS)
  const [saveData, setSaveData] = useSaveData()

  const todayKey = getDailyChallengeKey()
  const dailyBest = saveData.dailyBest[todayKey] ?? 0

  // Browsers block audio until a real user gesture occurs, so the AudioManager's
  // AudioContext is only created/resumed from inside an actual pointer or key event
  // handler - never on mount. Settings changes are pushed in on every render rather
  // than only here, since musicVolume/sfxVolume/muted can change at any time.
  useEffect(() => {
    const unlock = () => audioManager.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    audioManager.setVolumes(settings.musicVolume / 100, settings.sfxVolume / 100, settings.muted)
  }, [settings.musicVolume, settings.sfxVolume, settings.muted])

  // Every completed run (win or lose, it always ends in 'game-over') banks its coins
  // into the persistent total, and raises either the endless high score or today's
  // daily-challenge best depending on which mode it was. This is the one place
  // progression actually gets written, independent of whichever screen is mounted.
  useEffect(() => {
    const onGameOver = (payload: GameOverPayload) => {
      setSaveData((prev) => ({
        ...prev,
        totalCoins: prev.totalCoins + payload.coins,
        highScore:
          payload.mode === 'endless' ? Math.max(prev.highScore, payload.score) : prev.highScore,
        bestGhostRun: payload.ghostEvents ?? prev.bestGhostRun,
        dailyBest:
          payload.mode === 'daily'
            ? {
                ...prev.dailyBest,
                [todayKey]: Math.max(prev.dailyBest[todayKey] ?? 0, payload.score),
              }
            : prev.dailyBest,
      }))
    }
    EventBus.on('game-over', onGameOver)
    return () => {
      EventBus.off('game-over', onGameOver)
    }
  }, [setSaveData, todayKey])

  const handleUnlock = (id: string) => {
    const character = CHARACTERS.find((c) => c.id === id)
    if (
      !character ||
      saveData.unlockedCharacterIds.includes(id) ||
      saveData.totalCoins < character.unlockCost
    ) {
      return
    }
    setSaveData((prev) => ({
      ...prev,
      totalCoins: prev.totalCoins - character.unlockCost,
      unlockedCharacterIds: [...prev.unlockedCharacterIds, id],
    }))
  }

  const handleSelectCharacter = (id: string) => {
    setSaveData((prev) => ({ ...prev, selectedCharacterId: id }))
  }

  const startRun = (mode: GameMode) => {
    setPlayMode(mode)
    setScreen('playing')
  }

  return (
    // reducedMotion="user" makes every motion.* component in the app respect the
    // OS-level prefers-reduced-motion setting automatically (dropping transform
    // animations like the slide/scale entrances, keeping opacity fades) without
    // each component needing its own check.
    <MotionConfig reducedMotion="user">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={fadeTransition}
      >
        {screen === 'main-menu' && (
          <MainMenu
            highScore={saveData.highScore}
            totalCoins={saveData.totalCoins}
            dailyBest={dailyBest}
            onNavigate={setScreen}
            onPlay={() => startRun('endless')}
            onPlayDaily={() => startRun('daily')}
          />
        )}
        {screen === 'character-select' && (
          <CharacterSelect
            unlockedIds={saveData.unlockedCharacterIds}
            selectedId={saveData.selectedCharacterId}
            totalCoins={saveData.totalCoins}
            onSelect={handleSelectCharacter}
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
        {screen === 'playing' && (
          <PlayScreen
            highScore={saveData.highScore}
            characterId={saveData.selectedCharacterId}
            mode={playMode}
            dailyBest={dailyBest}
            ghostEvents={saveData.bestGhostRun}
            onExit={() => setScreen('main-menu')}
          />
        )}
      </motion.div>
    </MotionConfig>
  )
}
