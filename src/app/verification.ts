import { useMemo } from 'react'
import { sampleVerifications } from '@/data/verifications'
import { LINKED_PLACE_ID, places } from '@/data/places'
import { migrateVerification, type Verification } from '@/lib/verify'
import { useBizSnapshot, writeBiz } from './bizBridge'
import { useConsole } from './console'

export type VerificationRow = { placeId: string; v: Verification; source: 'biz' | 'sample' }

/** Every listed business with its verification: the /biz account for the linked place, sample records for the rest. */
export function useVerifications(): VerificationRow[] {
  const biz = useBizSnapshot()
  const { c } = useConsole()
  return useMemo(
    () =>
      places.map((p) =>
        p.id === LINKED_PLACE_ID
          ? { placeId: p.id, v: migrateVerification(biz.business.verification), source: 'biz' as const }
          : { placeId: p.id, v: migrateVerification(c.verifications[p.id] ?? sampleVerifications[p.id]), source: 'sample' as const },
      ),
    [biz.business.verification, c.verifications],
  )
}

export function useVerificationOf(placeId: string) {
  return useVerifications().find((r) => r.placeId === placeId)?.v
}

/** Save a reviewer decision; the linked business also gets a notification in /biz. */
export function useSaveVerification() {
  const { update } = useConsole()
  return (placeId: string, v: Verification, notif?: { tl: string; en: string }) => {
    if (placeId === LINKED_PLACE_ID) {
      return writeBiz((d) => ({
        ...d,
        business: { ...d.business, verification: v },
        notifs: notif ? [{ id: `n-${Date.now()}`, kind: 'report', at: new Date().toISOString(), to: '/biz/stats/backgrounds#verify', ...notif }, ...d.notifs] : d.notifs,
      }))
    }
    update((x) => ({ ...x, verifications: { ...x.verifications, [placeId]: v } }))
    return true
  }
}
