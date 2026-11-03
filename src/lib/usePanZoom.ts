import { useCallback, useEffect, useRef, useState } from 'react'

export type View = { x: number; y: number; s: number; r: number }
type Pt = { x: number; y: number }

const MIN = 0.45
const MAX = 3.2

/** World -> screen for a similarity transform: screen = T + R(r) * s * p */
export function project(v: View, p: Pt): Pt {
  const rad = (v.r * Math.PI) / 180
  const c = Math.cos(rad) * v.s
  const sn = Math.sin(rad) * v.s
  return { x: v.x + c * p.x - sn * p.y, y: v.y + sn * p.x + c * p.y }
}

/** Screen -> world */
export function unproject(v: View, q: Pt): Pt {
  const rad = (-v.r * Math.PI) / 180
  const dx = (q.x - v.x) / v.s
  const dy = (q.y - v.y) / v.s
  return { x: Math.cos(rad) * dx - Math.sin(rad) * dy, y: Math.sin(rad) * dx + Math.cos(rad) * dy }
}

export function viewCentering(world: Pt, size: { w: number; h: number }, s = 1, r = 0, offsetY = 0): View {
  const base = { x: 0, y: 0, s, r }
  const p = project(base, world)
  return { x: size.w / 2 - p.x, y: (size.h - offsetY) / 2 - p.y, s, r }
}

/** Pointer-based pan / pinch-zoom / two-finger rotate + wheel zoom. */
export function usePanZoom(initial: View) {
  const [view, setView] = useState<View>(initial)
  const ref = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, Pt>())
  const last = useRef<{ mid: Pt; dist: number; ang: number } | null>(null)
  const moved = useRef(0)
  const animRef = useRef<number | null>(null)

  const stopAnim = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = null
  }

  const local = (e: PointerEvent | WheelEvent): Pt => {
    const rect = ref.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const gesture = () => {
    const pts = [...pointers.current.values()]
    if (pts.length === 1) return { mid: pts[0], dist: 0, ang: 0 }
    const [a, b] = pts
    return {
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      ang: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    }
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-map-ui]')) return
      stopAnim()
      el.setPointerCapture(e.pointerId)
      pointers.current.set(e.pointerId, local(e))
      last.current = gesture()
      if (pointers.current.size === 1) moved.current = 0
    }
    const move = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, local(e))
      const g = gesture()
      const prev = last.current
      if (!prev) return
      const two = pointers.current.size >= 2 && prev.dist > 0
      setView((v) => {
        let ds = two ? g.dist / prev.dist : 1
        const ns = Math.min(MAX, Math.max(MIN, v.s * ds))
        ds = ns / v.s
        const dr = two ? g.ang - prev.ang : 0
        const rad = (dr * Math.PI) / 180
        const tx = v.x - prev.mid.x
        const ty = v.y - prev.mid.y
        return {
          x: g.mid.x + ds * (Math.cos(rad) * tx - Math.sin(rad) * ty),
          y: g.mid.y + ds * (Math.sin(rad) * tx + Math.cos(rad) * ty),
          s: ns,
          r: v.r + dr,
        }
      })
      moved.current += Math.hypot(g.mid.x - prev.mid.x, g.mid.y - prev.mid.y)
      last.current = g
    }
    const up = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId)
      last.current = pointers.current.size ? gesture() : null
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      stopAnim()
      const c = local(e)
      setView((v) => {
        const ns = Math.min(MAX, Math.max(MIN, v.s * Math.exp(-e.deltaY * 0.0015)))
        const k = ns / v.s
        return { ...v, x: c.x + k * (v.x - c.x), y: c.y + k * (v.y - c.y), s: ns }
      })
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [])

  /** Smoothly animate to a target view. */
  const flyTo = useCallback((target: View, ms = 600) => {
    stopAnim()
    let start: number | null = null
    let from: View | null = null
    const step = (t: number) => {
      if (start == null) start = t
      const k = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      setView((v) => {
        if (!from) from = v
        return {
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          s: from.s + (target.s - from.s) * e,
          r: from.r + (target.r - from.r) * e,
        }
      })
      if (k < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
  }, [])

  /** true if the last pointer sequence was a drag (to suppress taps) */
  const wasDrag = () => moved.current > 6

  return { ref, view, setView, flyTo, wasDrag }
}
