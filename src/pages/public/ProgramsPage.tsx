import { useEffect, useState, type FormEvent } from 'react'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'

import { Breadcrumbs, ProgramCard } from '../../components/public/EditorialContent'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { Button } from '../../components/ui/Button'
import { SeoHead, getConfiguredSocialImage } from '../../components/seo/SeoHead'
import { PublicBannerSlot } from '../../components/public/PublicBannerSlot'
import { listPublished, listPublicContentPage } from '../../services/content'
import type { CategoryRecord, ProgramRecord } from '../../types/content'

type Cursor = QueryDocumentSnapshot<DocumentData> | null
const PAGE_SIZE = 12

export function ProgramsPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(params.get('category') ?? '')
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [records, setRecords] = useState<ProgramRecord[]>([])
  const [cursorStack, setCursorStack] = useState<Cursor[]>([null])
  const [nextCursor, setNextCursor] = useState<Cursor>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const cursor = cursorStack[cursorStack.length - 1] ?? null
  const queryText = params.get('q') ?? ''
  const queryCategory = params.get('category') ?? ''

  useEffect(() => {
    setSearch(queryText)
    setCategoryId(queryCategory)
  }, [queryCategory, queryText])

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
    setLoading(true)
    setError('')
    void listPublicContentPage('programs', { search: queryText, categoryId: queryCategory, cursor, pageSize: PAGE_SIZE })
      .then((result) => {
        if (active) {
          setRecords(result.records)
          setNextCursor(result.nextCursor)
        }
      }).catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron consultar los programas.')
      }).finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [params, cursor, queryText, queryCategory])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (search.trim()) next.set('q', search.trim())
    if (categoryId) next.set('category', categoryId)
    setCursorStack([null])
    setParams(next)
  }

  function clearFilters() {
    setSearch('')
    setCategoryId('')
    setCursorStack([null])
    setParams({})
  }

  return (
    <div className="page-shell">
      <SeoHead
        title="Programas | Radio 99.7 FM"
        description="Conocé los programas, conductores y horarios publicados por Radio 99.7 FM."
        path="/programas"
        imageUrl={getConfiguredSocialImage()}
      />
      <div className="container narrow">
        <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Programas' }]} />
        <span className="eyebrow">Programación</span>
        <h1>Programas de Radio 99.7 FM</h1>
        <p className="lead">Conocé las voces y espacios publicados por la emisora.</p>
        <form className="public-search-filters" onSubmit={applyFilters}>
          <label>Buscar programas<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, descripción o conductor" /></label>
          <label>Categoría<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Todas las categorías</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <div className="public-search-actions"><Button type="submit">Buscar</Button><Button type="button" variant="ghost" onClick={clearFilters}>Limpiar filtros</Button></div>
        </form>
      </div>
      <PublicBannerSlot placement="programs" label="Sección de programas" />
      <div className="container">
        {error && <ErrorState title="No se pudieron cargar los programas" message={error} />}
        {loading ? <LoadingState title="Buscando programas" message="Consultando programas publicados en Firestore." /> :
          records.length === 0 ? <EmptyState title="No encontramos programas" message="Probá con otro término o cambiá la categoría." /> :
            <div className="card-grid three-up">{records.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                categoryName={categories.find((category) => category.id === program.categoryId)?.name ?? 'Programación'}
                returnTo={`/programas${params.size ? `?${params.toString()}` : ''}`}
              />
            ))}</div>}
        <nav className="pagination" aria-label="Paginación de programas">
          <Button variant="secondary" disabled={cursorStack.length <= 1 || loading} onClick={() => setCursorStack((current) => current.slice(0, -1))}>Anterior</Button>
          <span>Página {cursorStack.length}</span>
          <Button variant="secondary" disabled={!nextCursor || loading} onClick={() => nextCursor && setCursorStack((current) => [...current, nextCursor])}>Siguiente</Button>
        </nav>
      </div>
    </div>
  )
}
