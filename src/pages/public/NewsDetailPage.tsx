import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'

import { Breadcrumbs, EditorialImage, formatEditorialDate, NewsCard } from '../../components/public/EditorialContent'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { Button } from '../../components/ui/Button'
import { listPublished, listPublicContentPage, findPublishedBySlug } from '../../services/content'
import type { CategoryRecord, PostRecord, TagRecord } from '../../types/content'
import { normalizeEditorialSlug } from '../../utils/editorialSearch'
import { sanitizeEditorialHtml } from '../../utils/sanitizeHtml'
import { SeoHead, getConfiguredSocialImage, getSiteUrl } from '../../components/seo/SeoHead'
import { trackAnalyticsEvent } from '../../services/analytics'

export function NewsDetailPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const canonicalSlug = normalizeEditorialSlug(slug)
  const [article, setArticle] = useState<PostRecord | null>(null)
  const [related, setRelated] = useState<PostRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [tags, setTags] = useState<TagRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [sharing, setSharing] = useState(false)

  const returnTo = (location.state as { returnTo?: unknown } | null)?.returnTo
  const backHref = typeof returnTo === 'string' && (
    returnTo === '/noticias' || returnTo.startsWith('/noticias?') ||
    returnTo === '/buscar' || returnTo.startsWith('/buscar?') ||
    returnTo === '/deportes'
  )
    ? returnTo
    : '/noticias'
  const publishedAt = article?.publishedAt?.toDate()
  const articleStructuredData = useMemo(() => article ? ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.seoDescription || article.excerpt,
        datePublished: publishedAt?.toISOString(),
        dateModified: article.updatedAt.toDate().toISOString(),
        author: {
          '@type': article.authorName?.trim() ? 'Person' : 'Organization',
          name: article.authorName?.trim() || 'Radio 99.7 FM',
        },
        publisher: { '@type': 'Organization', name: 'Radio 99.7 FM' },
        mainEntityOfPage: getSiteUrl(`/noticias/${article.slug}`),
        ...(getConfiguredSocialImage() ? { image: [getConfiguredSocialImage()] } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: getSiteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Noticias', item: getSiteUrl('/noticias') },
          { '@type': 'ListItem', position: 3, name: article.title, item: getSiteUrl(`/noticias/${article.slug}`) },
        ],
      },
    ],
  }) : undefined, [article, publishedAt])

  useEffect(() => {
    let active = true
    if (!canonicalSlug) {
      setLoading(false)
      setArticle(null)
      return () => { active = false }
    }
    setLoading(true)
    setError('')
    void Promise.all([
      findPublishedBySlug('posts', canonicalSlug),
      listPublished('categories', 50),
      listPublished('tags', 50),
    ]).then(async ([found, nextCategories, nextTags]) => {
      if (!active) return
      setArticle(found)
      setCategories(nextCategories)
      setTags(nextTags)
      if (found && (found.categoryIds.length || found.tagIds.length)) {
        const page = await listPublicContentPage('posts', {
          categoryId: found.categoryIds[0],
          tagId: found.categoryIds.length ? undefined : found.tagIds[0],
          pageSize: 5,
        })
        if (active) setRelated(page.records.filter((post) => post.id !== found.id).slice(0, 4))
      } else {
        setRelated([])
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la noticia.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [canonicalSlug])

  useEffect(() => {
    if (article?.slug === canonicalSlug) trackAnalyticsEvent('news_view', { slug: article.slug })
  }, [article, canonicalSlug])

  async function shareArticle() {
    if (!article) return
    setSharing(true)
    setShareMessage('')
    const url = `${window.location.origin}/noticias/${article.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, text: article.excerpt, url })
        setShareMessage('Noticia compartida.')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setShareMessage('Enlace copiado al portapapeles.')
      } else {
        throw new Error('Este navegador no permite compartir ni copiar el enlace automáticamente.')
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setShareMessage(cause instanceof Error ? cause.message : 'No se pudo compartir el enlace.')
    } finally {
      setSharing(false)
    }
  }

  if (canonicalSlug && location.pathname !== `/noticias/${canonicalSlug}`) {
    return <Navigate to={`/noticias/${canonicalSlug}`} replace state={location.state} />
  }
  if (loading) return <><SeoHead title="Cargando noticia | Radio 99.7 FM" description="Verificando disponibilidad de la noticia." path={`/noticias/${canonicalSlug}`} noIndex /><LoadingState title="Cargando noticia" message="Verificando que la publicación siga disponible." /></>
  if (error) return <div className="container article-container"><SeoHead title="Noticia no disponible | Radio 99.7 FM" description="No se pudo verificar esta publicación." path={`/noticias/${canonicalSlug}`} noIndex /><ErrorState title="No se pudo cargar la noticia" message={error} /></div>
  if (!article) return <><SeoHead title="Noticia no disponible | Radio 99.7 FM" description="La publicación no existe o no está disponible." path={`/noticias/${canonicalSlug}`} noIndex /><EmptyState title="Noticia no disponible" message="El contenido no existe, no fue publicado o ya no está disponible." /></>

  const categoryNames = article.categoryIds.map((id) => categories.find((item) => item.id === id)?.name).filter((name): name is string => Boolean(name))
  const tagNames = article.tagIds.map((id) => tags.find((item) => item.id === id)?.name).filter((name): name is string => Boolean(name))

  return (
    <article className="page-shell">
      <SeoHead
        title={`${article.seoTitle || article.title} | Radio 99.7 FM`}
        description={article.seoDescription || article.excerpt}
        path={`/noticias/${article.slug}`}
        type="article"
        publishedAt={publishedAt?.toISOString()}
        modifiedAt={article.updatedAt.toDate().toISOString()}
        author={article.authorName?.trim() || 'Radio 99.7 FM'}
        imageUrl={getConfiguredSocialImage()}
        structuredData={articleStructuredData}
      />
      <div className="container article-container">
        <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Noticias', href: backHref }, { label: article.title }]} />
        <Link to={backHref} className="text-link">← Volver a noticias</Link>
        <div className="article-heading">
          <span className="pill neutral">{categoryNames.join(', ') || 'Noticias'}</span>
          <h1>{article.title}</h1>
          <p className="lead">{article.excerpt}</p>
          <div className="meta-row">
            <span>{article.authorName?.trim() || 'Redacción Radio Continental'}</span>
            <time dateTime={publishedAt?.toISOString()}>{formatEditorialDate(article.publishedAt)}</time>
          </div>
          <Button type="button" variant="secondary" disabled={sharing} onClick={() => void shareArticle()}>
            {sharing ? 'Compartiendo…' : 'Compartir noticia'}
          </Button>
          {shareMessage && <p className="form-feedback" role="status">{shareMessage}</p>}
        </div>
        {article.heroMediaId && <EditorialImage mediaId={article.heroMediaId} alt={article.title} className="article-image" loading="eager" />}
        <div className="article-body" dangerouslySetInnerHTML={{ __html: sanitizeEditorialHtml(article.body) }} />
        {tagNames.length > 0 && <p className="article-tags"><strong>Etiquetas:</strong> {tagNames.join(', ')}</p>}
      </div>
      {related.length > 0 && (
        <section className="container section-block">
          <div className="section-header"><div><span className="eyebrow">Seguí leyendo</span><h2>Noticias relacionadas</h2></div></div>
          <div className="card-grid three-up">{related.map((post) => (
            <NewsCard key={post.id} post={post} categoryNames={post.categoryIds.map((id) => categories.find((item) => item.id === id)?.name ?? '').filter(Boolean)} returnTo={backHref} />
          ))}</div>
        </section>
      )}
    </article>
  )
}
