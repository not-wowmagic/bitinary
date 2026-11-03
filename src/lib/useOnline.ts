import { useSyncExternalStore } from 'react'
import { isForced } from './forced'

function subscribe(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

export function useOnline() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  return online && !isForced('offline')
}
