import { useSyncExternalStore } from 'react'

function subscribeQuery(query: string) {
  return (cb: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', cb)
    return () => mql.removeEventListener('change', cb)
  }
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribeQuery(query),
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** mobile < 768 <= tablet < 1280 <= desktop */
export function useBreakpoint() {
  const tablet = useMediaQuery('(min-width: 768px)')
  const desktop = useMediaQuery('(min-width: 1280px)')
  return desktop ? 'desktop' : tablet ? 'tablet' : 'mobile'
}

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
