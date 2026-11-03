import { useEffect, useState } from 'react'
import { loadSaveData, saveSaveData } from '@/services/storage'
import type { SaveData } from '@/services/storage'

/** Loads the save blob once (through storage.ts's validation/migration) and writes
 * it back on every change, so every screen reading progression state stays in sync
 * with what's on disk without re-implementing the load/save dance itself. */
export function useSaveData(): [
  SaveData,
  (value: SaveData | ((prev: SaveData) => SaveData)) => void,
] {
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData())

  useEffect(() => {
    saveSaveData(saveData)
  }, [saveData])

  return [saveData, setSaveData]
}
