import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'

import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { listAdminRecords } from '../../services/admin'
import {
  archiveRecord,
  createProgramWithSchedule,
  createRecord,
  duplicateProgramWithSchedule,
  listProgramSchedule,
  listPublishedMedia,
  updateProgramWithSchedule,
  updateRecord,
  getPublicSiteConfig,
  type WeeklyScheduleInput,
} from '../../services/content'
import type { EditorialRecordMap, PostRecord, ProgramRecord, PublicationStatus } from '../../types/content'
import { sanitizeEditorialHtml } from '../../utils/sanitizeHtml'
import { DEFAULT_BROADCAST_TIME_ZONE } from '../../utils/broadcastSchedule'

type EditorialKind = 'posts' | 'programs'
type EditorialItem = PostRecord | ProgramRecord
type Cursor = QueryDocumentSnapshot<DocumentData> | null

const PAGE_SIZE = 15
const statusNames: Record<PublicationStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
}

function wrapLink(textarea: HTMLTextAreaElement | null, value: string, href: string, update: (next: string) => void) {
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = value.slice(start, end) || href
  const safeHref = href.replaceAll('"', '')
  const replacement = `<a href="${safeHref}">${selected}</a>`
  const next = `${value.slice(0, start)}${replacement}${value.slice(end)}`
  update(next)
  requestAnimationFrame(() => textarea.focus())
}

function wrapList(textarea: HTMLTextAreaElement | null, value: string, update: (next: string) => void) {
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = value.slice(start, end) || 'Elemento de lista'
  const items = selected.split(/\r?\n/).map((line) => `<li>${line}</li>`).join('')
  const replacement = `<ul>${items}</ul>`
  update(`${value.slice(0, start)}${replacement}${value.slice(end)}`)
  requestAnimationFrame(() => textarea.focus())
}

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180)
}

function formatDate(value: Timestamp | undefined) {
  return value?.toDate().toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) ?? 'Sin fecha'
}

function wrapSelection(textarea: HTMLTextAreaElement | null, tag: string, value: string, update: (next: string) => void) {
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = value.slice(start, end) || 'Escribí aquí'
  const replacement = `<${tag}>${selected}</${tag}>`
  const next = `${value.slice(0, start)}${replacement}${value.slice(end)}`
  update(next)
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selected.length)
  })
}

export function AdminContentPage() {
  const { pathname } = useLocation()
  const kind: EditorialKind = pathname.endsWith('/programas') ? 'programs' : 'posts'
  const pageTitle = kind === 'programs' ? 'Programas' : 'Noticias y publicaciones'
  const auth = useAuth()
  const [searchParams] = useSearchParams()
  const requestedStatus = searchParams.get('status')
  const [statusFilter, setStatusFilter] = useState<'all' | PublicationStatus>(
    requestedStatus === 'draft' || requestedStatus === 'published' || requestedStatus === 'archived'
      ? requestedStatus
      : 'all',
  )
  const [records, setRecords] = useState<EditorialItem[]>([])
  const [cursorStack, setCursorStack] = useState<Cursor[]>([null])
  const [nextCursor, setNextCursor] = useState<Cursor>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditorialItem | null>(null)
  const [preview, setPreview] = useState<EditorialItem | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [categoryOptions, setCategoryOptions] = useState<Array<EditorialRecordMap['categories']>>([])
  const [tagOptions, setTagOptions] = useState<Array<EditorialRecordMap['tags']>>([])
  const [mediaOptions, setMediaOptions] = useState<Array<EditorialRecordMap['media']>>([])
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [tagIds, setTagIds] = useState<string[]>([])
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [hosts, setHosts] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [imageMediaId, setImageMediaId] = useState('')
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleInput[]>([])
  const [timeZone, setTimeZone] = useState(DEFAULT_BROADCAST_TIME_ZONE)
  const [programSocials, setProgramSocials] = useState({ instagram: '', facebook: '', youtube: '' })
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [status, setStatus] = useState<Exclude<PublicationStatus, 'archived'>>('draft')
  const [previewMode, setPreviewMode] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const currentCursor = cursorStack[cursorStack.length - 1] ?? null
  const filteredRecords = useMemo(() => records.filter((record) => {
    const categoryLabel = kind === 'programs'
      ? categoryOptions.find((item) => item.id === (record as ProgramRecord).categoryId)?.name ?? ''
      : (record as PostRecord).categoryIds.map((id) =>
        categoryOptions.find((item) => item.id === id)?.name ?? '',
      ).join(' ')
    return `${record.title} ${record.slug} ${categoryLabel}`.toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase())
  }), [categoryOptions, kind, records, search])

  async function loadPage(cursor: Cursor, active = true) {
    if (auth.status !== 'signed-in') return
    setLoading(true)
    setLoadError('')
    try {
      const result = await listAdminRecords(auth.user, kind, {
        pageSize: PAGE_SIZE,
        cursor,
        status: statusFilter,
      })
      if (active) {
        setRecords(result.records as EditorialItem[])
        setNextCursor(result.nextCursor)
      }
    } catch (error) {
      if (active) setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el contenido.')
    } finally {
      if (active) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    setCursorStack([null])
    void loadPage(null, active)
    return () => { active = false }
  }, [auth.status, auth.status === 'signed-in' ? auth.user.uid : '', kind, statusFilter])

  useEffect(() => {
    if (cursorStack.length > 1) void loadPage(currentCursor)
  }, [cursorStack.length])

  useEffect(() => {
    if (auth.status !== 'signed-in') return
    let active = true
    void Promise.all([
      listAdminRecords(auth.user, 'categories', { pageSize: 50, status: 'published' }),
      listAdminRecords(auth.user, 'tags', { pageSize: 50, status: 'published' }),
      listPublishedMedia(50),
      getPublicSiteConfig(),
    ]).then(([categories, tags, media, siteConfig]) => {
      if (active) {
        setCategoryOptions(categories.records)
        setTagOptions(tags.records)
        setMediaOptions(media)
        const configuredTimeZone = siteConfig?.stationTimeZone ?? DEFAULT_BROADCAST_TIME_ZONE
        setTimeZone(configuredTimeZone)
      }
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar categorías y etiquetas.')
    })
    return () => { active = false }
  }, [auth.status, auth.status === 'signed-in' ? auth.user.uid : ''])

  function resetForm() {
    setFormOpen(false)
    setEditing(null)
    setPreviewMode(false)
    setTitle('')
    setSlug('')
    setSlugTouched(false)
    setCategoryId('')
    setCategoryIds([])
    setTagIds([])
    setExcerpt('')
    setBody('')
    setAuthorName('')
    setHosts('')
    setDescription('')
    setDuration('')
    setImageMediaId('')
    setWeeklySchedule([])
    setProgramSocials({ instagram: '', facebook: '', youtube: '' })
    setSeoTitle('')
    setSeoDescription('')
    setStatus('draft')
  }

  function startCreate() {
    setFeedback('')
    setEditing(null)
    resetForm()
    setFormOpen(true)
  }

  async function startEdit(record: EditorialItem) {
    setFeedback('')
    setEditing(record)
    setTitle(record.title)
    setSlug(record.slug)
    setSlugTouched(true)
    setStatus(record.status === 'archived' ? 'draft' : record.status)
    if (kind === 'posts') {
      const post = record as PostRecord
      setExcerpt(post.excerpt)
      setBody(post.body)
      setAuthorName(post.authorName ?? '')
      setCategoryIds(post.categoryIds)
      setTagIds(post.tagIds)
      setImageMediaId(post.heroMediaId ?? '')
      setSeoTitle(post.seoTitle ?? '')
      setSeoDescription(post.seoDescription ?? '')
    } else {
      const program = record as ProgramRecord
      setDescription(program.description)
      setCategoryId(program.categoryId)
      setHosts(program.hostNames.join(', '))
      setDuration(program.durationMinutes?.toString() ?? '')
      setImageMediaId(program.imageMediaId ?? '')
      setProgramSocials({ instagram: '', facebook: '', youtube: '', ...program.socialLinks })
      if (auth.status === 'signed-in') {
        try {
          const slots = await listProgramSchedule(auth.user, program.id)
          setWeeklySchedule(slots.map(({ dayOfWeek, startTime, endTime }) => ({
            dayOfWeek, startTime, endTime, timeZone,
          })))
        } catch (error) {
          setFeedback(error instanceof Error ? error.message : 'No se pudieron cargar los horarios del programa.')
        }
      }
    }
    setPreviewMode(false)
    setFormOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (auth.status !== 'signed-in') return
    setSaving(true)
    setFeedback('')
    const cleanBody = sanitizeEditorialHtml(body)
    try {
      if (kind === 'programs' && weeklySchedule.length === 0) {
        throw new Error('Seleccioná al menos un día y horario de emisión.')
      }
      if (kind === 'posts') {
        const values = {
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          body: cleanBody,
          categoryIds,
          tagIds,
          heroMediaId: imageMediaId.trim() || null,
          authorUid: editing && 'authorUid' in editing ? editing.authorUid : auth.user.uid,
          authorName: authorName.trim(),
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          status,
        }
        if (editing) {
          await updateRecord(auth.user, 'posts', editing.id, values, editing.updatedAt)
        } else {
          await createRecord(auth.user, 'posts', values)
        }
      } else {
        const values = {
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          categoryId,
          hostNames: hosts.split(',').map((host) => host.trim()).filter(Boolean),
          imageMediaId: imageMediaId.trim() || null,
          durationMinutes: duration ? Number(duration) : null,
          socialLinks: programSocials,
          status,
        }
        if (editing) {
          await updateProgramWithSchedule(auth.user, editing.id, values, weeklySchedule, editing.updatedAt)
        } else {
          await createProgramWithSchedule(auth.user, values, weeklySchedule)
        }
      }
      resetForm()
      setFeedback(editing ? 'Los cambios se guardaron en Firebase.' : 'El registro se creó en Firebase.')
      setCursorStack([null])
      await loadPage(null)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo guardar. No se confirmó ningún cambio.')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(record: EditorialItem, nextStatus: 'draft' | 'published') {
    if (auth.status !== 'signed-in') return
    try {
      await updateRecord(auth.user, kind, record.id, { status: nextStatus }, record.updatedAt)
      setFeedback(`Se guardó el estado "${statusNames[nextStatus]}".`)
      await loadPage(currentCursor)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo cambiar el estado.')
    }
  }

  async function duplicateProgram(record: ProgramRecord) {
    if (auth.status !== 'signed-in') return
    const suffix = `-copia-${Date.now().toString(36)}`
    try {
      await duplicateProgramWithSchedule(auth.user, record.id, record.updatedAt, `${record.slug.slice(0, 180 - suffix.length)}${suffix}`)
      setFeedback('El programa y sus horarios se duplicaron como borradores.')
      setCursorStack([null])
      await loadPage(null)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo duplicar el programa.')
    }
  }

  async function archive(record: EditorialItem) {
    if (auth.status !== 'signed-in' || !window.confirm(`¿Archivar "${record.title}"? Esta acción conserva el registro y no se puede deshacer desde el panel.`)) return
    try {
      await archiveRecord(auth.user, kind, record.id, record.updatedAt)
      setFeedback('El registro se archivó en Firebase.')
      await loadPage(currentCursor)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo archivar el registro.')
    }
  }

  async function goNext() {
    if (!nextCursor) return
    setCursorStack((current) => [...current, nextCursor])
  }

  function goPrevious() {
    if (cursorStack.length > 1) setCursorStack((current) => current.slice(0, -1))
  }

  function toggleSelection(id: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(id) ? values.filter((value) => value !== id) : [...values, id])
  }

  function toggleScheduleDay(dayOfWeek: number, checked: boolean) {
    setWeeklySchedule((current) => checked
      ? [...current, { dayOfWeek, startTime: '', endTime: '', timeZone }]
      : current.filter((slot) => slot.dayOfWeek !== dayOfWeek))
  }

  function updateScheduleTime(dayOfWeek: number, field: 'startTime' | 'endTime', value: string) {
    setWeeklySchedule((current) => current.map((slot) =>
      slot.dayOfWeek === dayOfWeek ? { ...slot, [field]: value, timeZone } : slot,
    ))
  }

  return (
    <div className="admin-module">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Gestión editorial · Firebase</span>
          <h1>{pageTitle}</h1>
          <p className="lead">Buscá, filtrá y administrá contenido por estado.</p>
        </div>
        <Button onClick={startCreate}>Nuevo {kind === 'programs' ? 'programa' : 'artículo'}</Button>
      </header>

      {feedback && <p className="form-feedback" role="status">{feedback}</p>}
      {loadError && <ErrorState title="No se pudo cargar el módulo" message={loadError} />}

      <div className="admin-toolbar">
        <label className="search-field">
          Buscar en esta página
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título, slug o categoría" />
        </label>
        <label className="search-field">
          Estado
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">Todos</option>
            <option value="draft">Borradores</option>
            <option value="published">Publicados</option>
            <option value="archived">Archivados</option>
          </select>
        </label>
      </div>

      {formOpen && (
        <form className="form-card admin-edit-form" onSubmit={(event) => void submit(event)}>
          <div className="section-header">
            <div><span className="eyebrow">{editing ? 'Edición' : 'Nuevo registro'}</span><h2>{editing ? 'Editar contenido' : 'Crear contenido'}</h2></div>
            <Button variant="ghost" onClick={resetForm}>Cerrar</Button>
          </div>
          <div className="form-grid">
            <label>Título<input value={title} onChange={(event) => {
              const nextTitle = event.target.value
              setTitle(nextTitle)
              if (!slugTouched) setSlug(slugify(nextTitle))
            }} maxLength={180} required /></label>
            <label>Slug<input value={slug} onChange={(event) => {
              setSlugTouched(true)
              setSlug(slugify(event.target.value))
            }} maxLength={180} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
            {kind === 'posts' ? (
              <>
                <label className="field-span">Resumen<textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={500} required rows={2} /></label>
                <label>Estado editorial<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="draft">Borrador</option><option value="published">Publicar ahora</option></select></label>
                <label>Autor UID<input value={editing && 'authorUid' in editing ? editing.authorUid : auth.status === 'signed-in' ? auth.user.uid : ''} readOnly /></label>
                <label>Firma del autor<input value={authorName} onChange={(event) => setAuthorName(event.target.value)} maxLength={120} placeholder="Redacción Radio Continental" /></label>
                <label>Imagen principal<select value={imageMediaId} onChange={(event) => setImageMediaId(event.target.value)}><option value="">Sin imagen</option>{mediaOptions.map((item) => <option key={item.id} value={item.id}>{item.originalName} · {item.altText}</option>)}</select></label>
                <fieldset className="choice-field"><legend>Categorías</legend>{categoryOptions.length ? categoryOptions.map((option) => <label key={option.id}><input type="checkbox" checked={categoryIds.includes(option.id)} onChange={() => toggleSelection(option.id, categoryIds, setCategoryIds)} /> {option.name}</label>) : <Link to="/admin/categorias">Primero creá categorías publicadas.</Link>}</fieldset>
                <fieldset className="choice-field"><legend>Etiquetas</legend>{tagOptions.map((option) => <label key={option.id}><input type="checkbox" checked={tagIds.includes(option.id)} onChange={() => toggleSelection(option.id, tagIds, setTagIds)} /> {option.name}</label>)}{tagOptions.length === 0 && <Link to="/admin/etiquetas">Crear etiquetas</Link>}</fieldset>
                <label>SEO · Título<input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={180} /></label>
                <label>SEO · Descripción<input value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} maxLength={320} /></label>
                <div className="field-span rich-editor">
                  <span className="field-label">Contenido enriquecido · HTML seguro</span>
                  <div className="editor-toolbar" aria-label="Herramientas de formato">
                    {(['p', 'h2', 'h3', 'strong', 'em', 'blockquote'] as const).map((tag) => (
                      <Button key={tag} variant="ghost" onClick={() => wrapSelection(bodyRef.current, tag, body, setBody)}>{tag.toUpperCase()}</Button>
                    ))}
                    <Button variant="ghost" onClick={() => wrapList(bodyRef.current, body, setBody)}>Lista</Button>
                    <Button variant="ghost" onClick={() => {
                      const href = window.prompt('Ingresá un enlace HTTPS o mailto:')
                      if (href && /^(https:\/\/|mailto:)/i.test(href)) {
                        wrapLink(bodyRef.current, body, href, setBody)
                      }
                    }}>Enlace</Button>
                    <Button variant="ghost" onClick={() => {
                      const src = window.prompt('Ingresá la URL HTTPS de la imagen:')
                      const alt = window.prompt('Texto alternativo de la imagen:')
                      if (src && alt && /^https:\/\//i.test(src)) setBody((current) => `${current}\n<img src="${src.replaceAll('"', '')}" alt="${alt.replaceAll('"', '')}">`)
                    }}>Imagen HTTPS</Button>
                  </div>
                  <textarea ref={bodyRef} value={body} onChange={(event) => setBody(event.target.value)} maxLength={100000} rows={12} required aria-label="Contenido del artículo" />
                  <small>Al guardar se permiten párrafos, títulos, listas, citas, enlaces seguros e imágenes HTTPS. El resto del HTML se elimina.</small>
                </div>
                <div className="field-span preview-actions">
                  <Button variant="secondary" onClick={() => setPreviewMode((current) => !current)}>{previewMode ? 'Ocultar previsualización' : 'Previsualizar'}</Button>
                  {previewMode && <article className="article-body editor-preview"><h2>{title || 'Vista previa'}</h2><p>{excerpt}</p><div dangerouslySetInnerHTML={{ __html: sanitizeEditorialHtml(body) }} /></article>}
                </div>
              </>
            ) : (
              <>
                <label>Categoría<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required><option value="">Seleccioná una categoría</option>{categoryOptions.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label>
                <label>Conductores · separados por coma<input value={hosts} onChange={(event) => setHosts(event.target.value)} maxLength={600} required /></label>
                <label className="field-span">Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} required rows={4} /></label>
                <label>Duración en minutos<input type="number" min={1} max={1440} value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
                <label>Imagen<select value={imageMediaId} onChange={(event) => setImageMediaId(event.target.value)}><option value="">Sin imagen</option>{mediaOptions.map((item) => <option key={item.id} value={item.id}>{item.originalName} · {item.altText}</option>)}</select></label>
                <label>Estado<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="draft">Desactivado / borrador</option><option value="published">Activo / publicado</option></select></label>
                <fieldset className="choice-field field-span"><legend>Días y horarios de emisión</legend>
                  {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, index) => {
                    const slot = weeklySchedule.find((item) => item.dayOfWeek === index)
                    return <div className="schedule-form-row" key={day}>
                      <label><input type="checkbox" checked={Boolean(slot)} onChange={(event) => toggleScheduleDay(index, event.target.checked)} /> {day}</label>
                      {slot && <><label>Desde<input type="time" required value={slot.startTime} onChange={(event) => updateScheduleTime(index, 'startTime', event.target.value)} /></label><label>Hasta<input type="time" required value={slot.endTime} onChange={(event) => updateScheduleTime(index, 'endTime', event.target.value)} /></label></>}
                    </div>
                  })}
                  <label className="field-span">Zona horaria de la emisora<input value={timeZone} readOnly /><small>Se configura en Configuración de emisora.</small></label>
                </fieldset>
                <fieldset className="choice-field field-span"><legend>Redes sociales · opcionales</legend>
                  {(['instagram', 'facebook', 'youtube'] as const).map((network) => <label key={network}>{network}<input type="url" value={programSocials[network]} onChange={(event) => setProgramSocials((current) => ({ ...current, [network]: event.target.value }))} placeholder="https://…" /></label>)}
                </fieldset>
              </>
            )}
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando en Firebase…' : editing ? 'Guardar cambios' : 'Crear borrador'}</Button>
            <Button variant="ghost" onClick={resetForm} disabled={saving}>Cancelar</Button>
          </div>
        </form>
      )}

      {loading ? <LoadingState title="Cargando desde Firebase" message="Consultando registros y permisos." /> :
        filteredRecords.length === 0 ? <EmptyState title={search ? 'Sin coincidencias en esta página' : 'No hay registros para este filtro'} message={search ? 'Probá otra búsqueda o avanzá de página.' : 'Creá un primer registro para comenzar.'} /> : (
          <div className="table-card admin-table-wrap">
            <table>
              <thead><tr><th>Título</th><th>Slug</th><th>Categoría</th><th>Autor</th><th>Publicado</th><th>Estado</th><th>Actualizado</th><th>Acciones</th></tr></thead>
              <tbody>{filteredRecords.map((record) => {
                const categoryLabel = kind === 'programs'
                  ? categoryOptions.find((item) => item.id === (record as ProgramRecord).categoryId)?.name ?? 'Sin categoría'
                  : (record as PostRecord).categoryIds.map((id) => categoryOptions.find((item) => item.id === id)?.name ?? '').filter(Boolean).join(', ') || 'Sin categoría'
                return <tr key={record.id}>
                  <td>{record.title}</td><td><code>{record.slug}</code></td><td>{categoryLabel}</td>
                  <td>{kind === 'posts' ? (record as PostRecord).authorUid : record.createdBy}</td>
                  <td>{formatDate(record.publishedAt)}</td>
                  <td><span className={`status-tag status-tag--${record.status}`}>{statusNames[record.status]}</span></td>
                  <td>{formatDate(record.updatedAt)}</td>
                  <td><div className="table-actions">
                    {kind === 'posts' && <Button variant="ghost" onClick={() => setPreview(record)}>Ver</Button>}
                    {record.status !== 'archived' && <Button variant="ghost" onClick={() => void changeStatus(record, record.status === 'published' ? 'draft' : 'published')}>{record.status === 'published' ? 'Despublicar' : 'Publicar'}</Button>}
                    {kind === 'programs' && record.status !== 'archived' && <Button variant="ghost" onClick={() => void duplicateProgram(record as ProgramRecord)}>Duplicar</Button>}
                    {record.status !== 'archived' && <Button variant="ghost" onClick={() => void startEdit(record)}>Editar</Button>}
                    {record.status !== 'archived' && <Button variant="ghost" className="text-button--danger" onClick={() => void archive(record)}>Archivar</Button>}
                  </div></td>
                </tr>
              })}</tbody>
            </table>
          </div>
        )}
      <nav className="pagination" aria-label="Paginación">
        <Button variant="secondary" onClick={goPrevious} disabled={cursorStack.length <= 1 || loading}>Anterior</Button>
        <span>Página {cursorStack.length}</span>
        <Button variant="secondary" onClick={() => void goNext()} disabled={!nextCursor || loading}>Siguiente</Button>
      </nav>

      {preview && <div className="modal-backdrop" role="presentation" onClick={() => setPreview(null)}>
        <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title" onClick={(event) => event.stopPropagation()}>
          <header><h2 id="preview-title">Previsualización</h2><Button variant="ghost" onClick={() => setPreview(null)}>Cerrar</Button></header>
          <article className="article-body"><span className="eyebrow">{statusNames[preview.status]}</span><h1>{preview.title}</h1>{kind === 'posts' && <><p>{(preview as PostRecord).excerpt}</p><div dangerouslySetInnerHTML={{ __html: sanitizeEditorialHtml((preview as PostRecord).body) }} /></>}</article>
        </section>
      </div>}
    </div>
  )
}
