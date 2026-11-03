import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'

/** Phase badges are design notes; visible only when `?notes=1` or the notes toggle in Screen Index is on. */
const KEY = 'bitinary:notes'
const listeners = new Set<() => void>()
export function setNotes(v: boolean) {
  localStorage.setItem(KEY, v ? '1' : '0')
  listeners.forEach((l) => l())
}
function notesOn() {
  return new URLSearchParams(location.search).get('notes') === '1' || localStorage.getItem(KEY) === '1'
}
export function useNotes() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => void listeners.delete(cb)
    },
    notesOn,
    () => false,
  )
}

const tone = {
  MVP: 'bg-ok-bg text-ok',
  P2: 'bg-caution-bg text-caution',
  P3: 'bg-[#E9E1FF] text-[#5B3CC4] dark:bg-[#2A2147] dark:text-[#C9B8FF]',
}
const label = { MVP: 'MVP', P2: 'Phase 2', P3: 'Phase 3' }

export function PhaseTag({ phase, force, className }: { phase: 'MVP' | 'P2' | 'P3'; force?: boolean; className?: string }) {
  const on = useNotes()
  if (!on && !force) return null
  return (
    <span className={cn('inline-flex h-5 items-center rounded-md px-1.5 font-display text-[10px] font-semibold uppercase tracking-wide', tone[phase], className)}>
      {label[phase]}
    </span>
  )
}
