import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { usePersistentState } from '@/lib/usePersistentState'
import { useMediaQuery } from '@/lib/useMedia'

export type ThemeMode = 'light' | 'dark' | 'system'

type ThemeCtx = { mode: ThemeMode; resolved: 'light' | 'dark'; setMode: (m: ThemeMode) => void }
const Ctx = createContext<ThemeCtx | null>(null)

const queryTheme = () => {
  const t = new URLSearchParams(window.location.search).get('theme')
  return t === 'light' || t === 'dark' ? t : null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = usePersistentState<ThemeMode>('theme', 'system')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const forced = useMemo(queryTheme, [])
  const resolved: 'light' | 'dark' = forced ?? (mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode)

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = resolved === 'dark' ? '#1A0D07' : '#FF6A00'
  }, [resolved])

  return <Ctx.Provider value={{ mode, resolved, setMode }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTheme outside ThemeProvider')
  return c
}
