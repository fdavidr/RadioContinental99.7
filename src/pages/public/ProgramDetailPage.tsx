import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'

import { Breadcrumbs, EditorialImage, formatEditorialDate } from '../../components/public/EditorialContent'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { findPublishedBySlug, listPublished, listPublicProgramSchedule } from '../../services/content'
import type { CategoryRecord, ProgramRecord, ScheduleRecord } from '../../types/content'
import { normalizeEditorialSlug } from '../../utils/editorialSearch'
import { SeoHead, getConfiguredSocialImage, getSiteUrl } from '../../components/seo/SeoHead'
import { trackAnalyticsEvent } from '../../services/analytics'

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function ProgramDetailPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const canonicalSlug = normalizeEditorialSlug(slug)
  const [program, setProgram] = useState<ProgramRecord | null>(null)
  const [category, setCategory] = useState<CategoryRecord | null>(null)
  const [schedule, setSchedule] = useState<ScheduleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const returnTo = (location.state as { returnTo?: unknown } | null)?.returnTo
  const backHref = typeof returnTo === 'string' && (
    returnTo === '/programas' || returnTo.startsWith('/programas?') ||
    returnTo === '/buscar' || returnTo.startsWith('/buscar?') ||
    returnTo === '/deportes'
  )
    ? returnTo
    : '/programas'
  const publishedAt = program?.publishedAt?.toDate()
  const programStructuredData = useMemo(() => program ? ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RadioSeries',
        name: program.title,
        description: program.description,
        url: getSiteUrl(`/programas/${program.slug}`),
        image: getConfiguredSocialImage(),
        creator: { '@type': 'Organization', name: 'Radio 99.7 FM' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: getSiteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Programas', item: getSiteUrl('/programas') },
          { '@type': 'ListItem', position: 3, name: program.title, item: getSiteUrl(`/programas/${program.slug}`) },
        ],
      },
    ],
  }) : undefined, [program])

  useEffect(() => {
    let active = true
    if (!canonicalSlug) {
      setLoading(false)
      setProgram(null)
      return () => { active = false }
    }
    setLoading(true)
    setError('')
    void findPublishedBySlug('programs', canonicalSlug).then(async (found) => {
      if (!active) return
      setProgram(found)
      if (!found) {
        setCategory(null)
        setSchedule([])
        return
      }
      const [categories, slots] = await Promise.all([
        listPublished('categories', 50),
        listPublicProgramSchedule(found.id),
      ])
      if (active) {
        setCategory(categories.find((item) => item.id === found.categoryId) ?? null)
        setSchedule(slots)
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el programa.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [canonicalSlug])

  useEffect(() => {
    if (program?.slug === canonicalSlug) trackAnalyticsEvent('program_view', { slug: program.slug })
  }, [canonicalSlug, program])

  if (canonicalSlug && location.pathname !== `/programas/${canonicalSlug}`) {
    return <Navigate to={`/programas/${canonicalSlug}`} replace state={location.state} />
  }
  if (loading) return <><SeoHead title="Cargando programa | Radio 99.7 FM" description="Verificando disponibilidad del programa." path={`/programas/${canonicalSlug}`} noIndex /><LoadingState title="Cargando programa" message="Verificando que el programa esté publicado." /></>
  if (error) return <div className="container"><SeoHead title="Programa no disponible | Radio 99.7 FM" description="No se pudo verificar este programa." path={`/programas/${canonicalSlug}`} noIndex /><ErrorState title="No se pudo cargar el programa" message={error} /></div>
  if (!program) return <><SeoHead title="Programa no disponible | Radio 99.7 FM" description="El programa no existe o no está disponible." path={`/programas/${canonicalSlug}`} noIndex /><EmptyState title="Programa no disponible" message="El contenido no existe, no fue publicado o ya no está disponible." /></>

  return (
    <article className="page-shell">
      <SeoHead
        title={`${program.title} | Programas | Radio 99.7 FM`}
        description={program.description}
        path={`/programas/${program.slug}`}
        imageUrl={getConfiguredSocialImage()}
        structuredData={programStructuredData}
      />
      <div className="container narrow">
        <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Programas', href: backHref }, { label: program.title }]} />
        <span className="eyebrow">{category?.name ?? 'Programación'} · Programa</span>
        <h1>{program.title}</h1>
        <p className="lead">{program.description}</p>
        {program.imageMediaId && <EditorialImage mediaId={program.imageMediaId} alt={program.title} className="article-image" loading="eager" />}
        <div className="detail-meta">
          <span><strong>Publicado:</strong> <time dateTime={publishedAt?.toISOString()}>{formatEditorialDate(program.publishedAt)}</time></span>
          <span><strong>Conduce:</strong> {program.hostNames.join(', ') || 'Redacción Radio Continental'}</span>
          {program.durationMinutes && <span><strong>Duración:</strong> {program.durationMinutes} minutos</span>}
          {schedule.length > 0
            ? schedule.map((slot) => (
              <span key={slot.id}><strong>{weekdays[slot.dayOfWeek]}:</strong> {slot.startTime}–{slot.endTime}{slot.endTime <= slot.startTime ? ' (+1 día)' : ''} · {slot.timeZone}</span>
            ))
            : <span>Horarios: pendientes de publicación</span>}
          {Object.entries(program.socialLinks ?? {}).filter(([, href]) => href).map(([network, href]) => (
            <a key={network} href={href} target="_blank" rel="noreferrer"><strong>{network}:</strong> visitar perfil</a>
          ))}
        </div>
        <Link to={backHref} className="text-link">← Volver a programas</Link>
      </div>
    </article>
  )
}
