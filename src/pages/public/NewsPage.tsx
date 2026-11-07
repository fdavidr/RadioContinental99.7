import { useEffect, useState, type FormEvent } from 'react'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'

import { Breadcrumbs, NewsCard } from '../../components/public/EditorialContent'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { listPublished, listPublicContentPage } from '../../services/content'
import type { CategoryRecord, PostRecord, TagRecord } from '../../types/content'
import { Button } from '../../components/ui/Button'
import { SeoHead, getConfiguredSocialImage } from '../../components/seo/SeoHead'
import { PublicBannerSlot } from '../../components/public/PublicBannerSlot'

type Cursor = QueryDocumentSnapshot<DocumentData> | null
const PAGE_SIZE = 12

export function NewsPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(params.get('category') ?? '')
  const [tagId, setTagId] = useState(params.get('tag') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [tags, setTags] = useState<TagRecord[]>([])
  const [records, setRecords] = useState<PostRecord[]>([])
  const [cursorStack, setCursorStack] = useState<Cursor[]>([null])
  const [nextCursor, setNextCursor] = useState<Cursor>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cursor = cursorStack[cursorStack.length - 1] ?? null
  const querySearch = params.get('q') ?? ''
  const queryCategoryId = params.get('category') ?? ''
  const queryTagId = params.get('tag') ?? ''
  const queryFrom = params.get('from') ?? ''
  const queryTo = params.get('to') ?? ''

  useEffect(() => {
    setSearch(params.get('q') ?? '')
    setCategoryId(params.get('category') ?? '')
    setTagId(params.get('tag') ?? '')
    setFrom(params.get('from') ?? '')
    setTo(params.get('to') ?? '')
  }, [params])

  useEffect(() => {
    let active = true
    void Promise.all([
      listPublished('categories', 50),
      listPublished('tags', 50),
    ]).then(([nextCategories, nextTags]) => {
      if (active) {
        setCategories(nextCategories)
        setTags(nextTags)
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los filtros editoriales.')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const fromDate = queryFrom ? new Date(`${queryFrom}T00:00:00`) : undefined
    const toDate = queryTo ? new Date(`${queryTo}T23:59:59.999`) : undefined
    void listPublicContentPage('posts', {
      search: querySearch,
      categoryId: queryCategoryId,
      tagId: queryTagId,
      from: fromDate,
      to: toDate,
      pageSize: PAGE_SIZE,
      cursor,
    }).then((result) => {
      if (active) {
        setRecords(result.records)
        setNextCursor(result.nextCursor)
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron consultar las noticias.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [params, cursor, querySearch, queryCategoryId, queryTagId, queryFrom, queryTo])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (search.trim()) next.set('q', search.trim())
    if (categoryId) next.set('category', categoryId)
    if (tagId) next.set('tag', tagId)
    if (from) next.set('from', from)
    if (to) next.set('to', to)
    setCursorStack([null])
    setParams(next)
  }

  function resetFilters() {
    setSearch('')
    setCategoryId('')
    setTagId('')
    setFrom('')
    setTo('')
    setCursorStack([null])
    setParams({})
  }

  return (
    <div className="page-shell">
      <SeoHead
        title="Noticias | Radio 99.7 FM"
        description="Leé las últimas noticias y publicaciones de Radio 99.7 FM."
        path="/noticias"
        imageUrl={getConfiguredSocialImage()}
      />
      <div className="container narrow">
        <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Noticias' }]} />
        <span className="eyebrow">Desde la redacción</span>
        <h1>Noticias</h1>
        <p className="lead">Actualidad, historias y temas que forman parte de la conversación.</p>
        <form className="public-search-filters" onSubmit={applyFilters}>
          <label>Buscar noticias<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título, tema o autor" /></label>
          <label>Categoría<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Todas las categorías</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label>Etiqueta<select value={tagId} onChange={(event) => setTagId(event.target.value)}><option value="">Todas las etiquetas</option>{tags.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label>Desde<input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
          <label>Hasta<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
          <div className="public-search-actions"><Button type="submit">Buscar</Button><Button type="button" variant="ghost" onClick={resetFilters}>Limpiar filtros</Button></div>
        </form>
      </div>

      <PublicBannerSlot placement="news" label="Sección de noticias" />
      <div className="container">
        {error && <ErrorState title="No se pudo cargar el contenido" message={error} />}
        {loading ? <LoadingState title="Buscando noticias" message="Consultando solo publicaciones visibles en Firestore." /> :
          records.length === 0 ? <EmptyState title="No encontramos noticias" message="Probá con otras palabras o quitá alguno de los filtros." /> :
            <div className="card-grid three-up">
              {records.map((post) => (
                <NewsCard
                  key={post.id}
                  post={post}
                  categoryNames={post.categoryIds.map((id) => categories.find((category) => category.id === id)?.name ?? '').filter(Boolean)}
                  returnTo={`/noticias${params.size ? `?${params.toString()}` : ''}`}
                />
              ))}
            </div>}
        <nav className="pagination" aria-label="Paginación de noticias">
          <Button variant="secondary" disabled={cursorStack.length <= 1 || loading} onClick={() => setCursorStack((current) => current.slice(0, -1))}>Anterior</Button>
          <span>Página {cursorStack.length}</span>
          <Button variant="secondary" disabled={!nextCursor || loading} onClick={() => nextCursor && setCursorStack((current) => [...current, nextCursor])}>Siguiente</Button>
        </nav>
      </div>
    </div>
  )
}
