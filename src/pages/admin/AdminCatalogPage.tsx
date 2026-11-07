import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Timestamp, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'

import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { findAdminScheduleOverlap, listAdminRecords } from '../../services/admin'
import { archiveRecord, createRecord, getPublicSiteConfig, updateRecord } from '../../services/content'
import type {
  BannerRecord,
  CategoryRecord,
  EditorialRecordMap,
  PublicationStatus,
  ScheduleRecord,
  TagRecord,
} from '../../types/content'
import { DEFAULT_BROADCAST_TIME_ZONE } from '../../utils/broadcastSchedule'

type CatalogKind = 'schedule' | 'categories' | 'tags' | 'banners'
type CatalogItem = ScheduleRecord | CategoryRecord | TagRecord | BannerRecord
type Cursor = QueryDocumentSnapshot<DocumentData> | null
const PAGE_SIZE = 20
const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const config: Record<CatalogKind, { title: string; description: string }> = {
  schedule: { title: 'Programación', description: 'Emisiones semanales vinculadas a los programas.' },
  categories: { title: 'Categorías', description: 'Clasificación editorial para programas y publicaciones.' },
  tags: { title: 'Etiquetas', description: 'Términos para organizar y encontrar publicaciones.' },
  banners: { title: 'Banners publicitarios', description: 'Ubicaciones y periodos visibles en el sitio.' },
}

function statusLabel(status: PublicationStatus) {
  return status === 'published' ? 'Publicado' : status === 'draft' ? 'Borrador' : 'Archivado'
}

export function AdminCatalogPage() {
  const { pathname } = useLocation()
  const kind: CatalogKind = pathname.endsWith('/programacion')
    ? 'schedule'
    : pathname.endsWith('/categorias')
      ? 'categories'
      : pathname.endsWith('/etiquetas')
        ? 'tags'
        : 'banners'
  const auth = useAuth()
  const [records, setRecords] = useState<CatalogItem[]>([])
  const [programOptions, setProgramOptions] = useState<Array<EditorialRecordMap['programs']>>([])
  const [mediaOptions, setMediaOptions] = useState<Array<EditorialRecordMap['media']>>([])
  const [cursorStack, setCursorStack] = useState<Cursor[]>([null])
  const [nextCursor, setNextCursor] = useState<Cursor>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | PublicationStatus>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [programId, setProgramId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [timeZone, setTimeZone] = useState(DEFAULT_BROADCAST_TIME_ZONE)
  const [placement, setPlacement] = useState('home-top')
  const [mediaId, setMediaId] = useState('')
  const [bannerAltText, setBannerAltText] = useState('')
  const [bannerOrder, setBannerOrder] = useState('0')
  const [targetUrl, setTargetUrl] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [status, setStatus] = useState<Exclude<PublicationStatus, 'archived'>>('draft')

  const currentCursor = cursorStack[cursorStack.length - 1] ?? null
  const visibleRecords = useMemo(() => records.filter((record) =>
    JSON.stringify(record).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  ), [records, search])

  async function loadPage(cursor: Cursor, active = true) {
    if (auth.status !== 'signed-in') return
    setLoading(true)
    setError('')
    try {
      const result = await listAdminRecords(auth.user, kind, {
        pageSize: PAGE_SIZE, cursor, status: filter,
      })
      if (active) {
        setRecords(result.records as CatalogItem[])
        setNextCursor(result.nextCursor)
      }
    } catch (cause) {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el módulo.')
    } finally {
      if (active) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    setCursorStack([null])
    void loadPage(null, active)
    return () => { active = false }
  }, [auth.status, auth.status === 'signed-in' ? auth.user.uid : '', kind, filter])

  useEffect(() => {
    if (cursorStack.length > 1) void loadPage(currentCursor)
  }, [cursorStack.length])

  useEffect(() => {
    if (auth.status !== 'signed-in') return
    let active = true
    const mediaPromise = auth.role === 'superadmin'
      ? listAdminRecords(auth.user, 'media', { pageSize: 50, status: 'published' })
      : Promise.resolve({ records: [] as Array<EditorialRecordMap['media']> })
    void Promise.all([
      listAdminRecords(auth.user, 'programs', { pageSize: 50, status: 'all' }),
      mediaPromise,
      getPublicSiteConfig(),
    ]).then(([programs, media, siteConfig]) => {
      if (active) {
        setProgramOptions(programs.records)
        setMediaOptions(media.records)
        const configuredTimeZone = siteConfig?.stationTimeZone ?? DEFAULT_BROADCAST_TIME_ZONE
        setTimeZone(configuredTimeZone)
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las opciones.')
    })
    return () => { active = false }
  }, [auth.status, auth.status === 'signed-in' ? auth.user.uid : ''])

  function clearForm() {
    setFormOpen(false)
    setEditing(null)
    setName('')
    setSlug('')
    setDescription('')
    setSortOrder('0')
    setProgramId('')
    setDayOfWeek('1')
    setStartTime('09:00')
    setEndTime('10:00')
    setPlacement('home-top')
    setMediaId('')
    setBannerAltText('')
    setBannerOrder('0')
    setTargetUrl('')
    setStartsAt('')
    setEndsAt('')
    setStatus('draft')
  }

  function openCreate() {
    setFeedback('')
    clearForm()
    setFormOpen(true)
  }

  function openEdit(record: CatalogItem) {
    setFeedback('')
    setEditing(record)
    setStatus(record.status === 'archived' ? 'draft' : record.status)
    if (kind === 'categories' || kind === 'tags') {
      const item = record as CategoryRecord | TagRecord
      setName(item.name)
      setSlug(item.slug)
      if ('description' in item) setDescription(item.description)
      if ('sortOrder' in item) setSortOrder(String(item.sortOrder))
    } else if (kind === 'schedule') {
      const item = record as ScheduleRecord
      setProgramId(item.programId)
      setDayOfWeek(String(item.dayOfWeek))
      setStartTime(item.startTime)
      setEndTime(item.endTime)
      setTimeZone(item.timeZone)
    } else {
      const item = record as BannerRecord
      setName(item.label)
      setPlacement(item.placement === 'home' ? 'home-top' : item.placement)
      setMediaId(item.mediaId)
      setBannerAltText(item.altText ?? '')
      setBannerOrder(String(item.sortOrder ?? 0))
      setTargetUrl(item.targetUrl ?? '')
      setStartsAt(item.startsAt?.toDate().toISOString().slice(0, 16) ?? '')
      setEndsAt(item.endsAt?.toDate().toISOString().slice(0, 16) ?? '')
    }
    setFormOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (auth.status !== 'signed-in') return
    setSaving(true)
    setFeedback('')
    try {
      if (kind === 'categories') {
        const values = { name: name.trim(), slug: slug.trim(), description: description.trim(), sortOrder: Number(sortOrder), status }
        if (editing) await updateRecord(auth.user, kind, editing.id, values, editing.updatedAt)
        else await createRecord(auth.user, kind, values)
      } else if (kind === 'tags') {
        const values = { name: name.trim(), slug: slug.trim(), status }
        if (editing) await updateRecord(auth.user, kind, editing.id, values, editing.updatedAt)
        else await createRecord(auth.user, kind, values)
      } else if (kind === 'schedule') {
        const values = { programId, dayOfWeek: Number(dayOfWeek), startTime, endTime, timeZone, status }
        const overlapping = await findAdminScheduleOverlap(auth.user, {
          id: editing?.id ?? '__new__',
          ...values,
        }, editing?.id)
        if (overlapping) {
          const overlappingProgram = programOptions.find((item) => item.id === overlapping.programId)
          throw new Error(
            `El horario se superpone con "${overlappingProgram?.title ?? 'otro programa'}" el ${weekdays[overlapping.dayOfWeek]} (${overlapping.startTime}–${overlapping.endTime}).`,
          )
        }
        if (editing) await updateRecord(auth.user, kind, editing.id, values, editing.updatedAt)
        else await createRecord(auth.user, kind, values)
      } else {
        const values = {
          label: name.trim(),
          placement: placement.trim(),
          mediaId,
          altText: bannerAltText.trim(),
          sortOrder: Number(bannerOrder),
          targetUrl: targetUrl.trim() || null,
          startsAt: startsAt ? Timestamp.fromDate(new Date(startsAt)) : null,
          endsAt: endsAt ? Timestamp.fromDate(new Date(endsAt)) : null,
          status,
        }
        if (editing) await updateRecord(auth.user, kind, editing.id, values, editing.updatedAt)
        else await createRecord(auth.user, kind, values)
      }
      clearForm()
      setFeedback(editing ? 'Los cambios se guardaron en Firebase.' : 'El registro se creó en Firebase.')
      setCursorStack([null])
      await loadPage(null)
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'No se confirmó el guardado.')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(record: CatalogItem, nextStatus: 'draft' | 'published') {
    if (auth.status !== 'signed-in') return
    try {
      await updateRecord(auth.user, kind, record.id, { status: nextStatus }, record.updatedAt)
      setFeedback(`Estado actualizado a ${statusLabel(nextStatus)}.`)
      await loadPage(currentCursor)
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado.')
    }
  }

  async function archive(record: CatalogItem) {
    if (auth.status !== 'signed-in' || !window.confirm(`¿Archivar "${recordTitle(record)}"? Se conservará el registro.`)) return
    try {
      await archiveRecord(auth.user, kind, record.id, record.updatedAt)
      setFeedback('El registro se archivó en Firebase.')
      await loadPage(currentCursor)
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'No se pudo archivar el registro.')
    }
  }

  function recordTitle(record: CatalogItem) {
    if (kind === 'schedule') {
      const schedule = record as ScheduleRecord
      const program = programOptions.find((item) => item.id === schedule.programId)
      return `${program?.title ?? 'Programa'} · ${weekdays[schedule.dayOfWeek]}`
    }
    return kind === 'banners' ? (record as BannerRecord).label : (record as CategoryRecord | TagRecord).name
  }

  function recordDetail(record: CatalogItem) {
    if (kind === 'schedule') {
      const schedule = record as ScheduleRecord
      return `${weekdays[schedule.dayOfWeek]} · ${schedule.startTime}–${schedule.endTime}`
    }
    if (kind === 'categories') return (record as CategoryRecord).slug
    if (kind === 'tags') return (record as TagRecord).slug
    const banner = record as BannerRecord
    return `${banner.placement} · ${banner.targetUrl ?? 'Sin destino'}`
  }

  return (
    <div className="admin-module">
      <header className="page-heading">
        <div><span className="eyebrow">Gestión administrativa · Firebase</span><h1>{config[kind].title}</h1><p className="lead">{config[kind].description}</p></div>
        <Button onClick={openCreate}>Nuevo registro</Button>
      </header>
      {feedback && <p className="form-feedback" role="status">{feedback}</p>}
      {error && <ErrorState title="No se pudo cargar el módulo" message={error} />}
      <div className="admin-toolbar">
        <label className="search-field">Buscar en esta página<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar registros" /></label>
        <label className="search-field">Estado<select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Todos</option><option value="draft">Borradores</option><option value="published">Publicados</option><option value="archived">Archivados</option></select></label>
      </div>
      {formOpen && <form className="form-card admin-edit-form" onSubmit={(event) => void submit(event)}>
        <div className="section-header"><div><span className="eyebrow">{editing ? 'Editar' : 'Crear'}</span><h2>{editing ? 'Editar registro' : 'Nuevo registro'}</h2></div><Button variant="ghost" onClick={clearForm}>Cerrar</Button></div>
        <div className="form-grid">
          {(kind === 'categories' || kind === 'tags') && <>
            <label>Nombre<input value={name} onChange={(event) => { setName(event.target.value); setSlug(event.target.value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) }} maxLength={100} required /></label>
            <label>Slug<input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-'))} maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
            {kind === 'categories' && <><label>Orden<input type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></label><label className="field-span">Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={3} /></label></>}
          </>}
          {kind === 'schedule' && <>
            <label>Programa<select value={programId} onChange={(event) => setProgramId(event.target.value)} required><option value="">Seleccioná un programa</option>{programOptions.map((item) => <option key={item.id} value={item.id}>{item.title} · {statusLabel(item.status)}</option>)}</select>{programOptions.length === 0 && <small><Link to="/admin/programas">Crear un programa primero.</Link></small>}</label>
            <label>Día<select value={dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value)}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
            <label>Desde<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></label>
            <label>Hasta<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></label>
            <label>Zona horaria de la emisora<input value={timeZone} readOnly aria-describedby="schedule-time-zone-help" /><small id="schedule-time-zone-help">Se configura en Configuración de emisora. Horarios nocturnos pueden finalizar al día siguiente.</small></label>
          </>}
          {kind === 'banners' && <>
            <label>Nombre del banner<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></label>
            <label>Ubicación<select value={placement} onChange={(event) => setPlacement(event.target.value)}><option value="home-top">Inicio · Principal</option><option value="home-feed">Inicio · Entre noticias</option><option value="news">Noticias</option><option value="programs">Programas</option><option value="footer">Pie de página</option></select></label>
            <label>Medio publicado<select value={mediaId} onChange={(event) => setMediaId(event.target.value)} required><option value="">Seleccioná un medio</option>{mediaOptions.map((item) => <option key={item.id} value={item.id}>{item.originalName} · {item.id}</option>)}</select>{mediaOptions.length === 0 && <small><Link to="/admin/multimedia">Cargá y publicá un medio primero.</Link></small>}</label>
            <label>Texto alternativo<input value={bannerAltText} onChange={(event) => setBannerAltText(event.target.value)} maxLength={500} required /></label>
            <label>Orden de aparición<input type="number" min={0} max={10000} step={1} value={bannerOrder} onChange={(event) => setBannerOrder(event.target.value)} required /></label>
            <label>Destino HTTPS<input type="url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://…" /></label>
            <label>Inicio<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
            <label>Fin<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
          </>}
          <label>{kind === 'banners' ? 'Estado del banner' : 'Estado'}<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="draft">{kind === 'banners' ? 'Inactivo' : 'Borrador'}</option><option value="published">{kind === 'banners' ? 'Activo' : 'Publicado'}</option></select></label>
        </div>
        <div className="form-actions"><Button type="submit" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear registro'}</Button><Button variant="ghost" onClick={clearForm} disabled={saving}>Cancelar</Button></div>
      </form>}
      {loading ? <LoadingState title="Cargando datos de Firebase" /> :
        visibleRecords.length === 0 ? <EmptyState title={search ? 'Sin coincidencias en esta página' : 'No hay registros con este filtro'} message="Creá registros o ajustá los filtros para ver resultados." /> :
          <div className="table-card admin-table-wrap"><table><thead><tr><th>Nombre</th><th>Detalle</th><th>Estado</th><th>Actualizado</th><th>Acciones</th></tr></thead><tbody>
            {visibleRecords.map((record) => <tr key={record.id}><td>{recordTitle(record)}</td><td>{recordDetail(record)}</td><td><span className={`status-tag status-tag--${record.status}`}>{kind === 'banners' ? (record.status === 'published' ? 'Activo' : record.status === 'draft' ? 'Inactivo' : 'Archivado') : statusLabel(record.status)}</span></td><td>{record.updatedAt.toDate().toLocaleString('es-AR')}</td><td><div className="table-actions">
              {record.status !== 'archived' && <><Button variant="ghost" onClick={() => openEdit(record)}>Editar</Button><Button variant="ghost" onClick={() => void changeStatus(record, record.status === 'published' ? 'draft' : 'published')}>{record.status === 'published' ? 'Desactivar' : 'Publicar'}</Button><Button variant="ghost" className="text-button--danger" onClick={() => void archive(record)}>Archivar</Button></>}
            </div></td></tr>)}
          </tbody></table></div>}
      <nav className="pagination" aria-label="Paginación"><Button variant="secondary" disabled={cursorStack.length <= 1 || loading} onClick={() => setCursorStack((current) => current.slice(0, -1))}>Anterior</Button><span>Página {cursorStack.length}</span><Button variant="secondary" disabled={!nextCursor || loading} onClick={() => nextCursor && setCursorStack((current) => [...current, nextCursor])}>Siguiente</Button></nav>
    </div>
  )
}
