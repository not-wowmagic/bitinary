import { useCallback, useEffect, useState } from 'react'
import { readStored } from '@/lib/usePersistentState'

export type DevBanner = {
  id: string
  title: string
  subtitle: string
  business: string
  placeId: string
  tone: 'orange' | 'brown' | 'amber'
  image: string
  cta: string
  until: string
  active: boolean
}

export type VerificationRecord = {
  accountId: string
  businessName: string
  submittedAt: string
  dtiNumber: string
  dtiDate: string
  permitNumber: string
  permitDate: string
  status: 'pending' | 'verified' | 'needs-docs'
}

export type DeveloperConfig = {
  theme: { primary: string; brown: string; cream: string; radius: string }
  banners: DevBanner[]
  verifications: VerificationRecord[]
}

const defaultConfig: DeveloperConfig = {
  theme: { primary: '#FF6A00', brown: '#2B130A', cream: '#FFF4E8', radius: '20' },
  banners: [],
  verifications: [],
}

export function getDeveloperConfig() {
  return readStored<DeveloperConfig>('developerConfig', defaultConfig)
}

function notify() {
  window.dispatchEvent(new Event('bitinary:developer-config'))
}

export function useDeveloperConfig() {
  const [config, setConfig] = useState(getDeveloperConfig)
  useEffect(() => {
    const refresh = () => setConfig(getDeveloperConfig())
    window.addEventListener('bitinary:developer-config', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('bitinary:developer-config', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  const save = useCallback((next: DeveloperConfig) => {
    localStorage.setItem('bitinary:developerConfig', JSON.stringify(next))
    setConfig(next)
    notify()
  }, [])
  return [config, save] as const
}

export function useDeveloperTheme() {
  const [config] = useDeveloperConfig()
  return config.theme
}
