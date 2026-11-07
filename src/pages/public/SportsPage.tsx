import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Breadcrumbs, NewsCard, ProgramCard } from '../../components/public/EditorialContent'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { listPublished, listPublicContentPage } from '../../services/content'
import type { CategoryRecord, PostRecord, ProgramRecord } from '../../types/content'
import { SeoHead, getConfiguredSocialImage } from '../../components/seo/SeoHead'

export function SportsPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [stories, setStories] = useState<PostRecord[]>([])
  const [sportsProgram, setSportsProgram] = useState<ProgramRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void listPublished('categories', 50).then(async (items) => {
      if (!active) return
      setCategories(items)
      const sportsCategory = items.find((item) => item.name.toLocaleLowerCase('es').includes('deport'))
      const [news, programs] = await Promise.all([
        sportsCategory ? listPublicContentPage('posts', { categoryId: sportsCategory.id, pageSize: 12 }) : Promise.resolve({ records: [] as PostRecord[], nextCursor: null }),
        listPublished('programs', 50),
      ])
      if (active) {
        setStories(news.records)
        setSportsProgram(programs.find((program) =>
          items.find((category) => category.id === program.categoryId)?.name.toLocaleLowerCase('es').includes('deport'),
        ) ?? null)
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la sección deportiva.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  return (
    <div className="page-shell">
      <SeoHead
        title="Deportes | Radio 99.7 FM"
        description="Noticias y programas deportivos publicados por Radio 99.7 FM."
        path="/deportes"
        imageUrl={getConfiguredSocialImage()}
      />
      <div className="sports-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Deportes' }]} />
          <span className="eyebrow">Cobertura deportiva</span>
          <h1>El deporte se vive en equipo</h1>
          <p className="lead">Noticias, entrevistas y conversación deportiva con foco en las voces de la comunidad.</p>
        </div>
      </div>
      <section className="container section-block">
        <div className="section-header"><div><span className="eyebrow">Actualidad</span><h2>En deportes</h2></div><Link to="/buscar?q=deportes" className="text-link">Buscar deportes ↗</Link></div>
        {error && <ErrorState title="No se pudo cargar deportes" message={error} />}
        {loading ? <LoadingState title="Cargando actualidad deportiva" /> :
          stories.length ? <div className="card-grid three-up">{stories.map((story) => (
            <NewsCard key={story.id} post={story} categoryNames={story.categoryIds.map((id) => categories.find((item) => item.id === id)?.name ?? '').filter(Boolean)} returnTo="/deportes" />
          ))}</div> :
            <EmptyState title="No hay noticias deportivas publicadas" message="Las notas aparecerán aquí cuando la redacción publique contenido en una categoría deportiva." />}
        {sportsProgram && (
          <div className="sports-program-card">
            <span className="eyebrow">Programa deportivo</span>
            <ProgramCard program={sportsProgram} categoryName={categories.find((item) => item.id === sportsProgram.categoryId)?.name ?? 'Deportes'} returnTo="/deportes" />
          </div>
        )}
      </section>
    </div>
  )
}
