import { useEffect, useRef, useState } from 'react'

import { trackAnalyticsEvent } from '../../services/analytics'
import type { BannerRecord } from '../../types/content'

export function PublicBannerSlot({ placement, label }: { placement: string; label: string }) {
  const slotRef = useRef<HTMLElement | null>(null)
  const [banner, setBanner] = useState<BannerRecord | null>(null)
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const [nearViewport, setNearViewport] = useState(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const slot = slotRef.current
    if (!slot || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearViewport(true)
        observer.disconnect()
      }
    }, { rootMargin: '300px 0px' })
    observer.observe(slot)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!nearViewport) return
    let active = true
    let objectUrl = ''
    void import('../../services/content').then(async ({ getPublishedMediaBlob, listPublicBanners }) => {
      const banners = await listPublicBanners(placement)
      const selected = banners[0]
      if (!active || !selected) return
      setBanner(selected)
      const media = await getPublishedMediaBlob(selected.mediaId)
      if (!active || !media) {
        if (active) setFailed(true)
        return
      }
      objectUrl = URL.createObjectURL(media.blob)
      setImage({ src: objectUrl, alt: selected.altText?.trim() || media.altText || selected.label })
    }).catch(() => {
      if (active) setFailed(true)
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [nearViewport, placement])

  if (!banner || !image) {
    return (
      <aside ref={slotRef} className="container ad-slot" aria-label={`${label} · Publicidad`}>
        {failed
          ? <><span>Publicidad</span><strong>No disponible temporalmente</strong></>
          : <><span>Publicidad</span><strong>{label}</strong></>}
      </aside>
    )
  }

  const creative = <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
  return (
    <aside ref={slotRef} className="container ad-slot ad-slot--creative" aria-label={`Publicidad · ${banner.label}`}>
      {banner.targetUrl
        ? <a
            href={banner.targetUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            referrerPolicy="no-referrer"
            onClick={() => trackAnalyticsEvent('advertisement_click', { placement })}
          >{creative}</a>
        : creative}
    </aside>
  )
}
