import { useEffect, useState } from 'react'

/**
 * A plain JSON-serialized localStorage-backed useState, for values simple enough not
 * to need the field-level validation/migration that services/storage.ts applies to
 * the save data blob (see hooks/useSaveData.ts for that one). Settings are the
 * primary use case: no schema versioning, just "remember what the player picked."
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Storage disabled or quota exceeded - losing this update is preferable to
      // crashing the app over a non-essential persistence failure.
    }
  }, [key, state])

  return [state, setState]
}
