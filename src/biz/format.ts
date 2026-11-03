import type { Lang } from '@/app/i18n'

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  tl: ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'],
}
const MON = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  tl: ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set', 'Okt', 'Nob', 'Dis'],
}
export const WEEKDAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  tl: ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado'],
}
export const WD = { en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], tl: ['Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab', 'Lin'] }

const d = (x: string | Date | number) => (x instanceof Date ? x : new Date(x))

/** "Friday, October 30" / "Biyernes, Oktubre 30" */
export const longDate = (x: string | Date | number, lang: Lang) => {
  const v = d(x)
  return `${WEEKDAYS[lang][v.getDay()]}, ${MONTHS[lang][v.getMonth()]} ${v.getDate()}`
}
/** "Oct 28" / "Okt 28" */
export const shortDay = (x: string | Date | number, lang: Lang) => {
  const v = d(x)
  return `${MON[lang][v.getMonth()]} ${v.getDate()}`
}
export const time12 = (x: string | Date | number) => {
  const v = d(x)
  const h = v.getHours()
  return `${h % 12 || 12}:${String(v.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
export const hourLabel = (h: number) => `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`

export function relTime(x: string | Date | number, lang: Lang) {
  const s = Math.round((Date.now() - d(x).getTime()) / 1000)
  const fut = s < 0
  const a = Math.abs(s)
  const unit = a < 3600 ? [Math.max(1, Math.round(a / 60)), 'min', 'minuto'] : a < 86400 ? [Math.round(a / 3600), 'h', 'oras'] : [Math.round(a / 86400), 'd', 'araw']
  const [n, en, tl] = unit as [number, string, string]
  if (lang === 'en') return fut ? `in ${n}${en === 'min' ? ' min' : en}` : `${n}${en === 'min' ? ' min' : en} ago`
  return fut ? `sa loob ng ${n} ${tl}` : `${n} ${tl} na ang nakaraan`
}

export const num = (n: number) => n.toLocaleString('en-PH')
export const compactNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))
export const pct = (n: number) => `${n > 0 ? '+' : ''}${Math.round(n)}%`
export function greeting(lang: Lang, h = new Date().getHours()) {
  if (h < 12) return lang === 'en' ? 'Good morning' : 'Magandang umaga'
  if (h < 18) return lang === 'en' ? 'Good afternoon' : 'Magandang hapon'
  return lang === 'en' ? 'Good evening' : 'Magandang gabi'
}
