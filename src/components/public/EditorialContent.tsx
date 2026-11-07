import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import type { PostRecord, ProgramRecord } from '../../types/content'

export type BreadcrumbItem = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Ruta de navegación">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href && index < items.length - 1
              ? <Link to={item.href}>{item.label}</Link>
              : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function EditorialImage({
  mediaId,
  alt,
  className,
  loading = 'lazy',
}: {
  mediaId: string | null | undefined
  alt: string
  className: string
  loading?: 'eager' | 'lazy'
}) {
  const elementRef = useRef<HTMLImageElement | HTMLDivElement | null>(null)
  const [loadedImage, setLoadedImage] = useState<{
    mediaId: string
    requestedAlt: string
    src: string
    alt: string
  } | null>(null)
  const [failedMediaId, setFailedMediaId] = useState('')
  const [nearViewport, setNearViewport] = useState(
    loading === 'eager' || typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    if (!mediaId || loading === 'eager') return
    const element = elementRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearViewport(true)
        observer.disconnect()
      }
    }, { rootMargin: '250px 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [loading, mediaId])

  useEffect(() => {
    let active = true
    let objectUrl = ''
    if (!mediaId || !nearViewport) {
      return () => { active = false }
    }
    void import('../../services/content')
      .then(({ getPublishedMediaBlob }) => getPublishedMediaBlob(mediaId))
      .then((media) => {
        if (!active || !media) return
        objectUrl = URL.createObjectURL(media.blob)
        setLoadedImage({
          mediaId,
          requestedAlt: alt,
          src: objectUrl,
          alt: media.altText.trim() || alt,
        })
      })
      .catch(() => { if (active) setFailedMediaId(mediaId) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [alt, mediaId, nearViewport])

  const currentImage = loadedImage && loadedImage.mediaId === mediaId && loadedImage.requestedAlt === alt
    ? loadedImage
    : null

  return currentImage
    ? <img ref={(element) => { elementRef.current = element }} className={className} src={currentImage.src} alt={currentImage.alt} loading={loading} decoding="async" />
    : <div
        ref={(element) => { elementRef.current = element }}
        className={`${className} editorial-image-placeholder`}
        role="img"
        aria-label={failedMediaId === mediaId ? `Imagen no disponible: ${alt}` : alt || 'Imagen no disponible'}
      />
}

export function formatEditorialDate(value: PostRecord['publishedAt'] | ProgramRecord['publishedAt']): string {
  if (!value) return 'Fecha no disponible'
  return value.toDate().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function NewsCard({
  post,
  categoryNames,
  returnTo,
}: {
  post: PostRecord
  categoryNames: string[]
  returnTo?: string
}) {
  const detailLink = {
    pathname: `/noticias/${post.slug}`,
    state: returnTo ? { returnTo } : undefined,
  }
  const publishedAt = post.publishedAt?.toDate()
  return (
    <article className="news-card public-news-card">
      <Link to={detailLink} className="public-news-card__image">
        <EditorialImage mediaId={post.heroMediaId} alt={post.title} className="" />
      </Link>
      <span className="pill neutral">{categoryNames.join(', ') || 'Noticias'}</span>
      <h3><Link to={detailLink}>{post.title}</Link></h3>
      <p>{post.excerpt}</p>
      <div className="meta-row">
        <span>{post.authorName?.trim() || 'Redacción Radio Continental'}</span>
        <time dateTime={publishedAt?.toISOString()}>{formatEditorialDate(post.publishedAt)}</time>
      </div>
      <Link to={detailLink} className="text-link">Leer artículo <span aria-hidden="true">↗</span></Link>
    </article>
  )
}

export function ProgramCard({
  program,
  categoryName,
  returnTo,
}: {
  program: ProgramRecord
  categoryName: string
  returnTo?: string
}) {
  const detailLink = {
    pathname: `/programas/${program.slug}`,
    state: returnTo ? { returnTo } : undefined,
  }
  const publishedAt = program.publishedAt?.toDate()
  return (
    <article className="program-card">
      <Link to={detailLink} className="program-card__image">
        <EditorialImage mediaId={program.imageMediaId} alt={program.title} className="" />
        <span className="program-card__category">{categoryName}</span>
      </Link>
      <div className="program-card__body">
        <time className="program-card__time" dateTime={publishedAt?.toISOString()}>
          {formatEditorialDate(program.publishedAt)}
        </time>
        <h3><Link to={detailLink}>{program.title}</Link></h3>
        <p>{program.description}</p>
        <div className="program-card__footer">
          <span>Conduce: {program.hostNames.join(', ') || 'Redacción Radio Continental'}</span>
          <Link to={detailLink} aria-label={`Ver detalle de ${program.title}`}>↗</Link>
        </div>
      </div>
    </article>
  )
}
