import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'bitinary:'
export const SYNC_EVENT = 'bitinary:sync'

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStored(key, initial))

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
      window.dispatchEvent(new Event(SYNC_EVENT))
    } catch {
      // storage full or unavailable: keep in-memory value
    }
  }, [key, value])

  const reset = useCallback(() => setValue(initial), [initial])
  return [value, setValue, reset] as const
}
