import { useSyncExternalStore } from 'react'
import { initialData, type BizData } from '@/biz/store'

/**
 * The traveler app and Bitinary Business share one device store (localStorage `bitinary:biz`).
 * BizProvider only mounts under /biz, so traveler screens read and write the business data here.
 */
const KEY = 'bitinary:biz'
const EVENT = 'bitinary:biz'

let cacheRaw: string | null | undefined
let cache: BizData = initialData

export function readBiz(): BizData {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    raw = null
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw
    try {
      cache = raw ? { ...initialData, ...(JSON.parse(raw) as BizData) } : initialData
    } catch {
      cache = initialData
    }
  }
  return cache
}

/** Returns false when storage is full (e.g. too many review photos). */
export function writeBiz(fn: (d: BizData) => BizData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(fn(readBiz())))
  } catch {
    return false
  }
  window.dispatchEvent(new Event(EVENT))
  return true
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb()
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function useBizSnapshot() {
  return useSyncExternalStore(subscribe, readBiz, () => initialData)
}
