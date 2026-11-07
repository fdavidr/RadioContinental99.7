import { useEffect, useState, type FormEvent } from 'react'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { Link, useSearchParams } from 'react-router-dom'

import { Breadcrumbs, NewsCard, ProgramCard } from '../../components/public/EditorialContent'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { Button } from '../../components/ui/Button'
import { SeoHead } from '../../components/seo/SeoHead'
import { listPublished, listPublicContentPage } from '../../services/content'
import type { CategoryRecord, PostRecord, ProgramRecord } from '../../types/content'

type Cursor = QueryDocumentSnapshot<DocumentData> | null
const RESULT_SIZE = 6

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('q') ?? '')
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [programs, setPrograms] = useState<ProgramRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [nextPostCursor, setNextPostCursor] = useState<Cursor>(null)
  const [nextProgramCursor, setNextProgramCursor] = useState<Cursor>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const search = params.get('q')?.trim() ?? ''

  useEffect(() => {
    let active = true
    void listPublished('categories', 50).then((items) => {
      if (active) setCategories(items)
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las categorías.')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setInput(search)
    setPosts([])
    setPrograms([])
    setNextPostCursor(null)
    setNextProgramCursor(null)
    if (!search) {
      setLoading(false)
      return () => { active = false }
    }
    setLoading(true)
    setError('')
    void Promise.all([
      listPublicContentPage('posts', { search, pageSize: RESULT_SIZE }),
      listPublicContentPage('programs', { search, pageSize: RESULT_SIZE }),
    ]).then(([postResult, programResult]) => {
      if (active) {
        setPosts(postResult.records)
        setPrograms(programResult.records)
        setNextPostCursor(postResult.nextCursor)
        setNextProgramCursor(programResult.nextCursor)
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudo completar la búsqueda.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [search])

  async function loadMore(kind: 'posts' | 'programs') {
    const cursor = kind === 'posts' ? nextPostCursor : nextProgramCursor
    if (!cursor || !search) return
    setLoading(true)
    setError('')
    try {
      if (kind === 'posts') {
        const result = await listPublicContentPage('posts', { search, pageSize: RESULT_SIZE, cursor })
        setPosts((current) => [...current, ...result.records])
        setNextPostCursor(result.nextCursor)
      } else {
        const result = await listPublicContentPage('programs', { search, pageSize: RESULT_SIZE, cursor })
        setPrograms((current) => [...current, ...result.records])
        setNextProgramCursor(result.nextCursor)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar más resultados.')
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (input.trim()) next.set('q', input.trim())
    setParams(next)
  }

  return (
    <div className="page-shell">
      <SeoHead
        title="Buscar | Radio 99.7 FM"
        description="Buscá noticias y programas publicados por Radio 99.7 FM."
        path="/buscar"
        noIndex
      />
      <div className="container narrow">
        <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Búsqueda' }]} />
        <span className="eyebrow">Descubrí Radio 99.7 FM</span>
        <h1>Buscar noticias y programas</h1>
        <form className="global-search-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="global-content-search">Buscar contenidos</label>
          <input id="global-content-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribí un tema, título o conductor" />
          <Button type="submit">Buscar</Button>
        </form>
        {!search && <p className="muted-copy">Ingresá una búsqueda para encontrar publicaciones y programas.</p>}
      </div>
      {error && <div className="container"><ErrorState title="No se pudo completar la búsqueda" message={error} /></div>}
      {loading && <div className="container"><LoadingState title="Buscando contenido" message="La búsqueda usa términos indexados; no descarga toda la colección." /></div>}
      {search && !loading && !error && posts.length === 0 && programs.length === 0 && !nextPostCursor && !nextProgramCursor && (
        <div className="container"><EmptyState title="Sin resultados" message={`No encontramos noticias ni programas para “${search}”. Probá con otras palabras.`} /></div>
      )}
      {posts.length > 0 && (
        <section className="container section-block">
          <div className="section-header"><div><span className="eyebrow">Publicaciones</span><h2>Noticias</h2></div><Link to={`/noticias?q=${encodeURIComponent(search)}`} className="text-link">Ver noticias y filtros ↗</Link></div>
          <div className="card-grid three-up">{posts.map((post) => <NewsCard key={post.id} post={post} categoryNames={post.categoryIds.map((id) => categories.find((item) => item.id === id)?.name ?? '').filter(Boolean)} returnTo={`/buscar?q=${encodeURIComponent(search)}`} />)}</div>
          {nextPostCursor && <div className="public-search-actions"><Button variant="secondary" disabled={loading} onClick={() => void loadMore('posts')}>Más noticias</Button></div>}
        </section>
      )}
      {programs.length > 0 && (
        <section className="container section-block">
          <div className="section-header"><div><span className="eyebrow">Al aire</span><h2>Programas</h2></div><Link to={`/programas?q=${encodeURIComponent(search)}`} className="text-link">Ver todos los programas ↗</Link></div>
          <div className="card-grid three-up">{programs.map((program) => <ProgramCard key={program.id} program={program} categoryName={categories.find((item) => item.id === program.categoryId)?.name ?? 'Programación'} returnTo={`/buscar?q=${encodeURIComponent(search)}`} />)}</div>
          {nextProgramCursor && <div className="public-search-actions"><Button variant="secondary" disabled={loading} onClick={() => void loadMore('programs')}>Más programas</Button></div>}
        </section>
      )}
      {search && !loading && !error && (
        <div className="container public-search-actions">
          {posts.length === 0 && nextPostCursor && <Button variant="secondary" onClick={() => void loadMore('posts')}>Seguir buscando noticias</Button>}
          {programs.length === 0 && nextProgramCursor && <Button variant="secondary" onClick={() => void loadMore('programs')}>Seguir buscando programas</Button>}
        </div>
      )}
    </div>
  )
}
