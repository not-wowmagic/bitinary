import { useCallback, useEffect, useState } from 'react'
import { useStore } from './store'
import { supabase } from '@/lib/supabase'
import { emptyVerification, migrateVerification, type Verification } from '@/lib/verify'

export type VerificationRow = {
  placeId: string
  name: string
  city: string
  image?: string
  owner: string
  contact: string
  v: Verification
}

const UPDATED = 'bitinary:console-verifications-updated'

export function useVerifications() {
  const [rows, setRows] = useState<VerificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useStore()

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id,name,city,cover_url,verification_status,verification_method,verification_files,onsite_date,verification_data,owner:profiles!businesses_owner_id_fkey(name,mobile)')
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) {
        setLoading(false)
        showToast({ text: `Could not load database verification records: ${error.message}`, expression: 'unsure' })
        return
      }

      setRows((data ?? []).map((business) => {
        const owner = business.owner as { name?: string; mobile?: string } | null
        const fallback = {
          ...emptyVerification,
          status: business.verification_status ?? 'none',
          method: business.verification_method ?? undefined,
          onsiteDate: business.onsite_date ?? undefined,
          files: business.verification_files ?? [],
        }
        const saved = business.verification_data as Partial<Verification> | null
        const hasSavedVerification = !!saved && Object.keys(saved).length > 0
        return {
          placeId: business.id,
          name: business.name,
          city: business.city || '—',
          image: business.cover_url ?? undefined,
          owner: owner?.name || 'No name set',
          contact: owner?.mobile ? `+63 ${owner.mobile}` : '—',
          v: migrateVerification(hasSavedVerification ? saved : fallback),
        }
      }))
      setLoading(false)
    }

    const refresh = () => {
      setLoading(true)
      void load()
    }
    void load()
    window.addEventListener(UPDATED, refresh)
    return () => {
      active = false
      window.removeEventListener(UPDATED, refresh)
    }
  }, [showToast])

  return { rows, loading }
}

export function useVerificationOf(placeId: string) {
  return useVerifications().rows.find((row) => row.placeId === placeId)?.v
}

/** Save a review decision to the business record and notify its owner. */
export function useSaveVerification() {
  return useCallback(async (businessId: string, verification: Verification, notification?: { tl: string; en: string }) => {
    const { error } = await supabase.rpc('set_dev_console_business_verification', {
      p_business_id: businessId,
      p_verification: verification,
      p_notification: notification ?? null,
    })
    if (error) return { error: error.message }
    window.dispatchEvent(new Event(UPDATED))
    return { error: null }
  }, [])
}
