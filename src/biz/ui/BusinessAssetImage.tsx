import { ImageOff } from "lucide-react"
import { useEffect, useState } from "react"
import { resolveBusinessImage } from "../db/assets"
import { useBiz } from "../store"

export function BusinessAssetImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src?: string | null
  alt: string
  className: string
  loading?: "eager" | "lazy"
}) {
  const { t } = useBiz()
  const [imageUrl, setImageUrl] = useState<string>()
  const [loadingImage, setLoadingImage] = useState(!!src)
  const [failed, setFailed] = useState(!src)
  const [retried, setRetried] = useState(false)

  useEffect(() => {
    let active = true
    setImageUrl(undefined)
    setLoadingImage(!!src)
    setFailed(!src)
    setRetried(false)

    if (src) {
      void resolveBusinessImage(src)
        .then((url) => {
          if (active) {
            setImageUrl(url)
            setLoadingImage(false)
          }
        })
        .catch((error: unknown) => {
          console.error("Business image could not be loaded.", error)
          if (active) {
            setFailed(true)
            setLoadingImage(false)
          }
        })
    }

    return () => {
      active = false
    }
  }, [src])

  if (loadingImage && !failed) {
    return (
      <div
        aria-hidden
        className={`${className} animate-pulse bg-sunken`}
      />
    )
  }

  if (!imageUrl || failed) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={`${className} grid place-items-center bg-sunken text-fg-2`}
      >
        <ImageOff size={20} aria-hidden />
        <span className="text-[11px]">
          {t("Hindi available ang larawan", "Image unavailable")}
        </span>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        if (!src || retried) {
          setFailed(true)
          return
        }

        setRetried(true)
        setLoadingImage(true)
        void resolveBusinessImage(src, true)
          .then((url) => {
            setImageUrl(url)
            setLoadingImage(false)
          })
          .catch((error: unknown) => {
            console.error("Business image could not be refreshed.", error)
            setFailed(true)
            setLoadingImage(false)
          })
      }}
    />
  )
}
