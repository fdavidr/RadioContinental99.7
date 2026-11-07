import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useRadio } from '../../contexts/RadioContext'
import { getBroadcastNow } from '../../utils/broadcastSchedule'
import { EditorialImage, formatEditorialDate, ProgramCard } from '../../components/public/EditorialContent'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import type { CategoryRecord, PostRecord } from '../../types/content'
import { SeoHead, getConfiguredSocialImage, getSiteUrl } from '../../components/seo/SeoHead'
import { PublicBannerSlot } from '../../components/public/PublicBannerSlot'
import { trackAnalyticsEvent } from '../../services/analytics'

export function HomePage() {
  const radio = useRadio()
  const [now, setNow] = useState(() => new Date())
  const [news, setNews] = useState<PostRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState('')
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const leadStory = news[0]
  const sportsStory = news.find((post) =>
    post.categoryIds.some((id) => categories.find((category) => category.id === id)?.name.toLocaleLowerCase('es').includes('deport')),
  )
  const sportsProgram = radio.programs.find((program) =>
    categories.find((category) => category.id === program.categoryId)?.name.toLocaleLowerCase('es').includes('deport'),
  )

  useEffect(() => {
    let active = true
    void import('../../services/content').then(({ listPublished, listPublicContentPage }) => Promise.all([
      listPublicContentPage('posts', { pageSize: 4 }),
      listPublished('categories', 50),
    ])).then(([posts, nextCategories]) => {
      if (active) {
        setNews(posts.records)
        setCategories(nextCategories)
      }
    }).catch((cause: unknown) => {
      if (active) setNewsError(cause instanceof Error ? cause.message : 'No se pudieron cargar las publicaciones.')
    }).finally(() => {
      if (active) setNewsLoading(false)
    })
    return () => { active = false }
  }, [])
  let broadcast = null
  try {
    broadcast = getBroadcastNow(radio.schedule, now, radio.timeZone)
  } catch {
    broadcast = null
  }
  const currentProgram = broadcast?.current
    ? radio.programs.find((program) => program.id === broadcast.current?.programId)
    : null
  const nextProgram = broadcast?.next
    ? radio.programs.find((program) => program.id === broadcast.next?.programId)
    : null
  const stationStructuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'RadioStation',
    name: radio.config?.stationName || 'Radio 99.7 FM',
    url: getSiteUrl('/'),
    description: radio.config?.slogan || 'Radio 99.7 FM',
    ...(radio.config?.socialLinks && Object.values(radio.config.socialLinks).length
      ? { sameAs: Object.values(radio.config.socialLinks).filter((url) => /^https:\/\//i.test(url)) }
      : {}),
  }), [radio.config])

  return (
    <>
      <SeoHead
        title="Radio 99.7 FM | Actualidad, deportes y comunidad"
        description={radio.config?.slogan || 'Actualidad, deportes, programas y cobertura en vivo de Radio 99.7 FM.'}
        path="/"
        imageUrl={getConfiguredSocialImage()}
        structuredData={stationStructuredData}
      />
      <section className="home-hero">
        <div className="container">
          <div className="hero-masthead">
            <div className="hero-masthead__copy">
              <span className="eyebrow">La radio que conecta</span>
              <h1>Las voces de tu día, <span>en una sola frecuencia.</span></h1>
              <p>{radio.config?.slogan || 'Información, conversación y deporte desde una mirada cercana.'}</p>
              <div className="hero-actions">
                <Link to="/en-vivo" className="button button--primary" onClick={() => trackAnalyticsEvent('live_click', { placement: 'home_hero' })}>
                  <span className="button-play" aria-hidden="true">▶</span>
                  Escuchar en vivo
                </Link>
                <Link to="/programacion" className="button button--ghost">Explorar programación <span aria-hidden="true">↗</span></Link>
              </div>
              <div className="frequency-note"><span className="frequency-note__wave" aria-hidden="true">)))</span><strong>99.7</strong><span>FM · Radio Continental</span></div>
            </div>
            <div className="hero-art">
              {radio.programs[0]?.imageMediaId && <EditorialImage mediaId={radio.programs[0].imageMediaId} alt={radio.programs[0].title} className="" loading="eager" />}
              <div className="hero-art__overlay" />
              <div className="hero-art__caption"><span>Señal abierta</span><strong>Una radio, muchas historias.</strong></div>
              <span className="hero-art__frequency" aria-hidden="true">99.7</span>
            </div>
          </div>

          <div className="broadcast-strip">
            <div className="broadcast-strip__status">
              <span className={`status-indicator ${radio.status === 'playing' ? 'status-indicator--live' : ''}`} />
              <div><small>Transmisión</small><strong>{radio.config?.streamUrl ? (radio.status === 'playing' ? 'Reproduciendo' : 'Señal configurada') : 'Pendiente de configuración'}</strong></div>
            </div>
            <div className="broadcast-strip__program">
              <span className="broadcast-icon" aria-hidden="true">♫</span>
              <div><small>Al aire ahora</small><strong>{currentProgram?.title ?? 'Sin programación confirmada'}</strong></div>
              {broadcast?.current && <span className="broadcast-time">{broadcast.current.startTime}–{broadcast.current.endTime}</span>}
            </div>
            <div className="broadcast-strip__program next-program">
              <span className="broadcast-icon" aria-hidden="true">◷</span>
              <div><small>Próximo programa</small><strong>{nextProgram?.title ?? 'No disponible'}</strong></div>
              {broadcast?.next && <span className="broadcast-time">{broadcast.next.startTime}–{broadcast.next.endTime}</span>}
            </div>
            <Link to="/en-vivo" className="broadcast-strip__link" aria-label="Ver estado de la transmisión">↗</Link>
          </div>
        </div>
      </section>

      <section className="section-block section-news">
        <div className="container">
          <SectionHeading eyebrow="En portada" title="Historias que importan" href="/noticias" linkLabel="Todas las noticias" />
          <div className="editorial-grid">
            {newsLoading ? <LoadingState title="Cargando publicaciones" /> : newsError ? <ErrorState title="No se pudieron cargar las noticias" message={newsError} /> : leadStory ? <Link to={`/noticias/${leadStory.slug}`} className="feature-story">
              <div className="story-image">
                {leadStory.heroMediaId && <EditorialImage mediaId={leadStory.heroMediaId} alt={leadStory.title} className="" />}
                <span className="story-category">{leadStory.categoryIds.map((id) => categories.find((item) => item.id === id)?.name).filter(Boolean).join(', ') || 'Noticias'}</span>
              </div>
              <div className="feature-story__copy">
                <span className="content-tag">Destacada</span>
                <h3>{leadStory.title}</h3>
                <p>{leadStory.excerpt}</p>
                <div className="meta-row">
                  <span>{leadStory.authorName?.trim() || 'Redacción Radio Continental'}</span>
                  <time dateTime={leadStory.publishedAt?.toDate().toISOString()}>{formatEditorialDate(leadStory.publishedAt)}</time>
                </div>
                <span className="story-read">Leer artículo <span aria-hidden="true">↗</span></span>
              </div>
            </Link> : <EmptyState title="Sin noticias destacadas" message="Las publicaciones aparecerán cuando la redacción publique contenido." />}
            <div className="side-stories">
              {news.slice(1, 4).map((story) => (
                <article className="side-story" key={story.id}>
                  <Link to={`/noticias/${story.slug}`} className="side-story__image" aria-label={`Ver artículo: ${story.title}`}>
                    {story.heroMediaId && <EditorialImage mediaId={story.heroMediaId} alt={story.title} className="" />}
                  </Link>
                  <div className="side-story__copy">
                    <span className="content-tag">{story.categoryIds.map((id) => categories.find((item) => item.id === id)?.name).filter(Boolean).join(', ') || 'Noticias'}</span>
                    <h3><Link to={`/noticias/${story.slug}`}>{story.title}</Link></h3>
                    <span className="story-read">Leer artículo <span aria-hidden="true">↗</span></span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicBannerSlot placement="home-top" label="Banner principal" />

      {(sportsStory || sportsProgram) && <section className="sports-feature">
        <div className="sports-feature__image">{sportsStory?.heroMediaId && <EditorialImage mediaId={sportsStory.heroMediaId} alt={sportsStory.title} className="" />}</div>
        <div className="container sports-feature__content">
          <div><span className="eyebrow">Pulso deportivo</span><span className="content-tag">{sportsStory ? 'Última publicación deportiva' : 'Programa deportivo'}</span>
            <h2>{sportsStory?.title ?? sportsProgram?.title}</h2><p>{sportsStory?.excerpt ?? sportsProgram?.description}</p>
            <Link to={sportsStory ? `/noticias/${sportsStory.slug}` : `/programas/${sportsProgram?.slug}`} className="button button--light">Descubrir deportes <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>}

      <section className="section-block">
        <div className="container">
          <SectionHeading eyebrow="Al aire en la grilla" title="Programas para acompañarte" href="/programas" linkLabel="Ver programación completa" />
          <div className="program-grid">
            {radio.programs.slice(0, 3).map((program) => <ProgramCard key={program.id} program={program} categoryName={categories.find((item) => item.id === program.categoryId)?.name ?? 'Programación'} />)}
            {radio.programs.length === 0 && <EmptyState title="Programas pendientes" message="Los programas se mostrarán al publicarse en la grilla." />}
          </div>
        </div>
      </section>

      <section className="section-block section-updates">
        <div className="container">
          <div className="updates-heading">
            <div><span className="eyebrow">Desde la redacción</span><h2>Lo último</h2></div>
            <Link to="/noticias" className="text-link">Ver publicaciones <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="updates-list">
            {news.map((item, index) => (
              <article className="update-row" key={item.id}>
                <span className="update-index">0{index + 1}</span>
                <span className="update-category">{item.categoryIds.map((id) => categories.find((category) => category.id === id)?.name).filter(Boolean).join(', ') || 'Noticias'}</span>
                <h3><Link to={`/noticias/${item.slug}`}>{item.title}</Link></h3>
                <time className="update-date" dateTime={item.publishedAt?.toDate().toISOString()}>{item.publishedAt?.toDate().toLocaleDateString('es-AR') ?? 'Fecha no disponible'}</time>
                <Link to={`/noticias/${item.slug}`} className="update-arrow" aria-label={`Leer ${item.title}`}>↗</Link>
              </article>
            ))}
          </div>
          {!newsLoading && news.length === 0 && !newsError && <EmptyState title="Todavía no hay publicaciones" message="Las últimas noticias aparecerán aquí cuando se publiquen." />}
        </div>
      </section>

      <PublicBannerSlot placement="home-feed" label="Entre publicaciones" />

      <section className="newsletter-cta">
        <div className="container newsletter-cta__inner">
          <div><span className="eyebrow">La radio en comunidad</span><h2>Tu día, en sintonía.</h2><p>Conocé la programación y encontrá el espacio que va con vos.</p></div>
          <Link to="/programacion" className="button button--primary">Descubrir la grilla <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </>
  )
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="section-heading">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
      <Link to={href} className="text-link">{linkLabel} <span aria-hidden="true">↗</span></Link>
    </div>
  )
}
