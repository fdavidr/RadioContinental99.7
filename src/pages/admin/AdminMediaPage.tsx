import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { listAdminRecords } from '../../services/admin'
import { archiveRecord, createRecord, updateRecord } from '../../services/content'
import { readAdminMedia, uploadMedia } from '../../services/media'
import type { MediaRecord, PublicationStatus } from '../../types/content'

type Cursor = QueryDocumentSnapshot<DocumentData> | null
const PAGE_SIZE = 20
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function AdminMediaPage() {
  const auth = useAuth()
  const [records, setRecords] = useState<MediaRecord[]>([])
  const [cursorStack, setCursorStack] = useState<Cursor[]>([null])
  const [nextCursor, setNextCursor] = useState<Cursor>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | PublicationStatus>('all')
  const [search, setSearch] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [remotePreview, setRemotePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const cursor = cursorStack[cursorStack.length - 1] ?? null
  const filtered = useMemo(() => records.filter((item) =>
    `${item.originalName} ${item.altText} ${item.contentType}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [records, search])

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function loadPage(next: Cursor, active = true) {
    if (auth.status !== 'signed-in') return
    setLoading(true)
    setError('')
    try {
      const result = await listAdminRecords(auth.user, 'media', { pageSize: PAGE_SIZE, cursor: next, status: statusFilter })
      if (active) {
        setRecords(result.records)
        setNextCursor(result.nextCursor)
      }
    } catch (cause) {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la biblioteca.')
    } finally {
      if (active) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    setCursorStack([null])
    void loadPage(null, active)
    return () => { active = false }
  }, [auth.status, auth.status === 'signed-in' ? auth.user.uid : '', statusFilter])

  useEffect(() => {
    if (cursorStack.length > 1) void loadPage(cursor)
  }, [cursorStack.length])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (auth.status !== 'signed-in' || !file) return
    setSaving(true)
    setError('')
    setMessage('')
    let uploadCompleted = false
    try {
      const uploaded = await uploadMedia(auth.user, file, altText)
      uploadCompleted = true
      await createRecord(auth.user, 'media', {
        ...uploaded,
        status: 'draft',
      })
      setFile(null)
      setAltText('')
      setMessage('La imagen quedó cargada en Storage y registrada como borrador privado en Firestore.')
      setCursorStack([null])
      await loadPage(null)
    } catch (cause) {
      setError(cause instanceof Error
        ? `${cause.message}${uploadCompleted ? ' El archivo subido permanece privado en Storage y no tiene registro Firestore; requiere revisión manual.' : ''}`
        : 'No se pudo completar la carga.')
    } finally {
      setSaving(false)
    }
  }

  async function changePublication(item: MediaRecord) {
    if (auth.status !== 'signed-in') return
    const publish = item.status !== 'published'
    try {
      await updateRecord(auth.user, 'media', item.id, {
        status: publish ? 'published' : 'draft',
        visibility: publish ? 'public' : 'private',
      }, item.updatedAt)
      setMessage(publish
        ? 'El registro se publicó y Storage confirmó visibilidad pública.'
        : 'El medio fue despublicado y Storage volvió a restringir su lectura.')
      await loadPage(cursor)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar la publicación.')
    }
  }

  async function archive(item: MediaRecord) {
    if (auth.status !== 'signed-in' || !window.confirm(`¿Archivar "${item.originalName}"? El archivo quedará privado.`)) return
    try {
      await archiveRecord(auth.user, 'media', item.id, item.updatedAt)
      setMessage('El medio se archivó y quedó privado en Storage.')
      await loadPage(cursor)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo archivar el archivo.')
    }
  }

  async function showRemotePreview(item: MediaRecord) {
    if (auth.status !== 'signed-in') return
    setRemotePreview('')
    try {
      const blob = await readAdminMedia(auth.user, item.storagePath)
      setRemotePreview(URL.createObjectURL(blob))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir la vista previa.')
    }
  }

  return (
    <div className="admin-module">
      <header className="page-heading"><div><span className="eyebrow">Solo superadministrador · Firebase Storage</span><h1>Biblioteca multimedia</h1><p className="lead">Carga limitada de imágenes; los archivos empiezan privados y solo se hacen públicos al publicar su registro.</p></div></header>
      {message && <p className="form-feedback" role="status">{message}</p>}
      {error && <ErrorState title="Operación multimedia incompleta" message={error} />}
      <form className="form-card admin-edit-form" onSubmit={(event) => void submit(event)}>
        <h2>Cargar imagen</h2>
        <p className="form-hint">JPEG, PNG, WebP o AVIF; máximo 10 MiB por imagen. Se procesa una carga por vez.</p>
        <div className="form-grid">
          <label className="field-span">Archivo<input type="file" accept={imageTypes.join(',')} required onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
          <label className="field-span">Texto alternativo<input value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={500} required /></label>
        </div>
        {previewUrl && <img className="media-preview" src={previewUrl} alt={altText || 'Vista previa local'} />}
        <Button type="submit" disabled={!file || !altText.trim() || saving}>{saving ? 'Subiendo a Storage…' : 'Subir como borrador privado'}</Button>
      </form>

      <div className="admin-toolbar">
        <label className="search-field">Buscar en esta página<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, tipo o texto alternativo" /></label>
        <label className="search-field">Estado<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Todos</option><option value="draft">Borradores</option><option value="published">Publicados</option><option value="archived">Archivados</option></select></label>
      </div>
      {loading ? <LoadingState title="Consultando Storage y Firestore" /> :
        filtered.length === 0 ? <EmptyState title="No hay imágenes para mostrar" message="Subí una imagen o modificá los filtros." /> :
          <div className="table-card admin-table-wrap"><table><thead><tr><th>Archivo</th><th>Formato / tamaño</th><th>Texto alternativo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
            {filtered.map((item) => <tr key={item.id}><td>{item.originalName}<small><code>{item.id}</code></small></td><td>{item.contentType} · {(item.sizeBytes / 1024 / 1024).toFixed(2)} MiB</td><td>{item.altText}</td><td>{item.status === 'published' ? 'Público' : item.status === 'draft' ? 'Privado · borrador' : 'Archivado'}</td><td><div className="table-actions">
              <Button variant="ghost" onClick={() => void showRemotePreview(item)}>Vista previa</Button>
              {item.status !== 'archived' && <><Button variant="ghost" onClick={() => void changePublication(item)}>{item.status === 'published' ? 'Despublicar' : 'Publicar'}</Button><Button variant="ghost" className="text-button--danger" onClick={() => void archive(item)}>Archivar</Button></>}
            </div></td></tr>)}
          </tbody></table></div>}
      <nav className="pagination" aria-label="Paginación"><Button variant="secondary" disabled={cursorStack.length <= 1 || loading} onClick={() => setCursorStack((current) => current.slice(0, -1))}>Anterior</Button><span>Página {cursorStack.length}</span><Button variant="secondary" disabled={!nextCursor || loading} onClick={() => nextCursor && setCursorStack((current) => [...current, nextCursor])}>Siguiente</Button></nav>
      {remotePreview && <div className="modal-backdrop" role="presentation" onClick={() => { URL.revokeObjectURL(remotePreview); setRemotePreview('') }}><section className="admin-modal" role="dialog" aria-modal="true" aria-label="Vista previa de imagen" onClick={(event) => event.stopPropagation()}><Button variant="ghost" onClick={() => { URL.revokeObjectURL(remotePreview); setRemotePreview('') }}>Cerrar</Button><img className="media-preview" src={remotePreview} alt="Vista previa de imagen cargada desde Storage" /></section></div>}
    </div>
  )
}
