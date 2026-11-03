import { useEffect, useState } from 'react'

/** Seconds remaining until `until` (epoch ms). */
export function useCountdown(until: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (until <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [until])
  return Math.max(0, Math.ceil((until - now) / 1000))
}

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
