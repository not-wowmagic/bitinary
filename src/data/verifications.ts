import { dayOffset, plusYears, type Verification, type VerifyStatus } from '@/lib/verify'
import { LINKED_PLACE_ID, places } from './places'

/**
 * Fictional DTI and Business permit records for every listed place except the one linked to /biz
 * (that one lives in the Bitinary Business store). Dates are relative to today so the mix of
 * pending, expiring and expired stays meaningful.
 */
type Seed = { status: VerifyStatus; submitted: number; reviewed?: number; permitIssued: number; permitDays: number; dtiAge: number; note?: string; missing?: ('dti' | 'permit')[]; onsite?: boolean }

const plan: Record<string, Seed> = {
  p1: { status: 'verified', submitted: -120, reviewed: -118, permitIssued: -130, permitDays: 230, dtiAge: 2100 },
  p2: { status: 'verified', submitted: -90, reviewed: -89, permitIssued: -95, permitDays: 18, dtiAge: 900 },
  p3: { status: 'verified', submitted: -300, reviewed: -296, permitIssued: -400, permitDays: -24, dtiAge: 3000 },
  p4: { status: 'pending', submitted: -1, permitIssued: -20, permitDays: 340, dtiAge: 400 },
  p5: { status: 'verified', submitted: -60, reviewed: -59, permitIssued: -70, permitDays: 295, dtiAge: 1200 },
  p6: { status: 'needs-docs', submitted: -6, reviewed: -4, permitIssued: -15, permitDays: 350, dtiAge: 600, note: 'Malabo ang kopya ng business permit. Mag-upload ng mas malinaw na litrato.', missing: ['permit'] },
  p7: { status: 'pending', submitted: -3, permitIssued: -30, permitDays: 330, dtiAge: 1500, onsite: true },
  p8: { status: 'verified', submitted: -200, reviewed: -198, permitIssued: -210, permitDays: 150, dtiAge: 2500 },
  p9: { status: 'rejected', submitted: -10, reviewed: -8, permitIssued: -50, permitDays: 310, dtiAge: 300, note: 'Hindi tugma ang pangalan sa DTI at sa business permit.' },
  p10: { status: 'pending', submitted: -4, permitIssued: -12, permitDays: 350, dtiAge: 800 },
  p11: { status: 'verified', submitted: -150, reviewed: -147, permitIssued: -160, permitDays: 200, dtiAge: 1800 },
}

const cityOf = (area: string) => (area === 'Batangas' ? 'Batangas City' : 'Maynila')
const code = (area: string) => (area === 'Batangas' ? 'BTG' : area === 'Binondo' ? 'BND' : 'MNL')
const at = (days: number) => new Date(Date.now() + days * 864e5).toISOString()

export const sampleVerifications: Record<string, Verification> = Object.fromEntries(
  places
    .filter((p) => p.id !== LINKED_PLACE_ID && plan[p.id])
    .map((p, i) => {
      const s = plan[p.id]
      const dtiRegistered = dayOffset(-s.dtiAge)
      const permitIssued = dayOffset(s.permitIssued)
      const history: Verification['history'] = [{ at: at(s.submitted), status: 'pending', by: 'owner' }]
      if (s.reviewed != null) history.push({ at: at(s.reviewed), status: s.status, by: 'reviewer', note: s.note })
      const v: Verification = {
        method: s.onsite ? 'onsite' : 'upload',
        dtiNo: String(2_345_601 + i * 97_313).slice(0, 7),
        dtiRegistered,
        dtiValidUntil: plusYears(dtiRegistered, 5),
        permitNo: `${permitIssued.slice(0, 4)}-${code(p.area)}-${String(1200 + i * 431).padStart(6, '0')}`,
        permitCity: cityOf(p.area),
        permitIssued,
        permitValidUntil: dayOffset(s.permitDays),
        docs: s.onsite ? {} : { dti: { name: `DTI-${p.logo.initials}.pdf`, size: 820_000, type: 'application/pdf' }, permit: { name: `Business-permit-${p.logo.initials}.jpg`, size: 640_000, type: 'image/jpeg' } },
        onsiteDate: s.onsite ? dayOffset(5) : undefined,
        onsiteSlot: s.onsite ? 'morning' : undefined,
        submittedAt: at(s.submitted),
        reviewedAt: s.reviewed != null ? at(s.reviewed) : undefined,
        reviewer: s.reviewed != null ? 'Bitinary Team' : undefined,
        note: s.note,
        missing: s.missing,
        history,
        status: s.status,
        files: [],
      }
      return [p.id, v]
    }),
)
