export const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`

export function verifiedLabel(days: number) {
  if (days <= 0) return 'Na-verify ngayon'
  if (days === 1) return 'Na-verify, 1 araw'
  if (days < 30) return `Na-verify, ${days} araw`
  const months = Math.round(days / 30)
  return `Na-verify, ${months} buwan`
}

export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

const MONTHS = ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set', 'Okt', 'Nob', 'Dis']
export function shortDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export const img = (id: string, w = 800, h?: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=70`
