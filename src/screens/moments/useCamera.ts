import { useCallback, useEffect, useRef, useState } from 'react'

export type CamStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'unavailable' | 'sample'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CamStatus>('idle')
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [torch, setTorch] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(
    async (mode = facing) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unavailable')
        return
      }
      setStatus('requesting')
      try {
        stop()
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean }
        setTorchSupported(!!caps.torch)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setStatus('live')
      } catch (e) {
        const name = (e as DOMException).name
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable')
      }
    },
    [facing, stop],
  )

  const flip = useCallback(() => {
    const next = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    if (status === 'live') start(next)
  }, [facing, start, status])

  const toggleTorch = useCallback(async () => {
    const next = !torch
    setTorch(next)
    const track = streamRef.current?.getVideoTracks()[0]
    if (track && torchSupported) {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }).catch(() => {})
    }
  }, [torch, torchSupported])

  /** Square crop of the current frame as a compressed JPEG data URL. */
  const capture = useCallback((filter = 'none'): string | null => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return null
    const side = Math.min(v.videoWidth, v.videoHeight)
    const c = document.createElement('canvas')
    c.width = c.height = 640
    const ctx = c.getContext('2d')!
    ctx.filter = filter
    if (facing === 'user') {
      ctx.translate(640, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, 640, 640)
    return c.toDataURL('image/jpeg', 0.72)
  }, [facing])

  // attach the stream once the <video> is mounted (it may render after permission is granted)
  useEffect(() => {
    const v = videoRef.current
    if (status === 'live' && v && streamRef.current && v.srcObject !== streamRef.current) {
      v.srcObject = streamRef.current
      v.play().catch(() => {})
    }
  })

  useEffect(() => stop, [stop])

  return { videoRef, status, setStatus, start, stop, flip, facing, torch, torchSupported, toggleTorch, capture }
}
