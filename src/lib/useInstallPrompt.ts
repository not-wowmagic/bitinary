import { useEffect, useState } from 'react'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: BIPEvent | null = null
const listeners = new Set<() => void>()
let installed = false
const notify = () => listeners.forEach((listener) => listener())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BIPEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    notify()
  })
}

export function useInstallPrompt() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    if (deferred || installed) l()
    return () => void listeners.delete(l)
  }, [])

  const isStandalone =
    installed ||
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

  async function install() {
    const prompt = deferred
    if (!prompt) return false
    deferred = null
    try {
      const promptResult = prompt.prompt()
      notify()
      await promptResult
      const choice = await prompt.userChoice
      return choice.outcome === 'accepted'
    } catch (error) {
      notify()
      console.error('PWA installation prompt failed:', error)
      return false
    }
  }

  return { canPrompt: !!deferred, isStandalone, isIOS, install }
}
