import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { listAdminRecords } from '../../services/admin'
import { MediaUploadError, changeMediaState, finalizeMediaUpload, prepareMediaUpload, readAdminMedia, uploadMedia, type MediaUploadOperation, type MediaUploadStage } from '../../services/media'
import type { MediaRecord, PublicationStatus } from '../../types/content'

type Cursor = QueryDocumentSnapshot<DocumentData> | null
type UploadPhase = 'idle' | 'validating' | 'checking' | 'uploading' | 'saving' | 'success' | 'error'
type PendingUpload = {
  operation: MediaUploadOperation
  storageUploadAttempted: boolean
  file?: File
}
const PAGE_SIZE = 20
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

function pendingUploadKey(uid: string): string {
  return `radio997:pending-media:${uid}`
}

function firebaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  if ('code' in error && typeof error.code === 'string') return error.code
  if ('cause' in error) return firebaseErrorCode(error.cause)
  return undefined
}

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
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const submissionLock = useRef(false)
  const activeUid = auth.status === 'signed-in' ? auth.user.uid : ''

  const cursor = cursorStack[cursorStack.length - 1] ?? null
  const uploadBusy = ['validating', 'checking', 'uploading', 'saving'].includes(uploadPhase)
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

  useEffect(() => {
    if (!activeUid) {
      setPendingUpload(null)
      return
    }
    try {
      const key = pendingUploadKey(activeUid)
      const stored = sessionStorage.getItem(key)
      if (!stored) {
        setPendingUpload(null)
        return
      }
      const parsed = JSON.parse(stored) as PendingUpload
      if (
        typeof parsed.operation?.operationId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.operation.operationId) ||
        parsed.operation.uid !== activeUid ||
        parsed.operation.storagePath !== `media/${parsed.operation.operationId}` ||
        typeof parsed.operation.originalName !== 'string' ||
        typeof parsed.operation.contentType !== 'string' ||
        !Number.isInteger(parsed.operation.sizeBytes) ||
        typeof parsed.operation.altText !== 'string' ||
        !/^[a-f0-9]{64}$/.test(parsed.operation.sha256) ||
        typeof parsed.storageUploadAttempted !== 'boolean'
      ) {
        throw new Error('Los datos de recuperación no coinciden con esta sesión.')
      }
      setPendingUpload(parsed)
      setAltText(parsed.operation.altText)
      setError('Se encontró una operación multimedia pendiente. El servidor verificará el archivo antes de registrarlo.')
    } catch (cause) {
      setError(cause instanceof Error
        ? `No se pudo recuperar la operación multimedia: ${cause.message}`
        : 'No se pudo recuperar la operación multimedia.')
    }
  }, [activeUid])

  function persistPendingUpload(attempt: PendingUpload | null): void {
    if (!activeUid) return
    if (attempt) sessionStorage.setItem(pendingUploadKey(activeUid), JSON.stringify({
      operation: attempt.operation,
      storageUploadAttempted: attempt.storageUploadAttempted,
    }))
    else sessionStorage.removeItem(pendingUploadKey(activeUid))
    setPendingUpload(attempt)
  }

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
    if (submissionLock.current || auth.status !== 'signed-in' || (!pendingUpload && !file)) return
    submissionLock.current = true
    const startedAt = Date.now()
    let activeStage: MediaUploadStage | 'saving' = pendingUpload?.storageUploadAttempted ? 'saving' : 'validating'
    let attempt = pendingUpload
    setError('')
    setMessage('')
    setUploadProgress(0)
    setUploadPhase(pendingUpload?.storageUploadAttempted ? 'saving' : 'validating')
    try {
      if (!attempt) {
        if (!file) throw new Error('Seleccioná una imagen para comenzar.')
        const operation = await prepareMediaUpload(auth.user, file, altText)
        attempt = { operation, file, storageUploadAttempted: false }
        persistPendingUpload(attempt)
      } else {
        attempt = { ...attempt, file: file ?? attempt.file }
        persistPendingUpload(attempt)
      }

      let registered = false
      if (attempt.storageUploadAttempted) {
        activeStage = 'saving'
        setUploadPhase('saving')
        try {
          await finalizeMediaUpload(auth.user, attempt.operation)
          registered = true
        } catch (recoveryError) {
          const code = firebaseErrorCode(recoveryError)
          if (code !== 'functions/failed-precondition' || !attempt.file) throw recoveryError
        }
      }

      if (!registered) {
        const uploadFile = attempt.file
        if (!uploadFile) {
          throw new Error('Storage todavía no confirma el archivo pendiente. Seleccioná nuevamente el mismo archivo para reintentar con el ID original.')
        }
        attempt = { ...attempt, storageUploadAttempted: true }
        persistPendingUpload(attempt)
        await uploadMedia(auth.user, uploadFile, attempt.operation, {
          onStage: (stage: MediaUploadStage) => {
            activeStage = stage
            setUploadPhase(stage)
          },
          onProgress: setUploadProgress,
        })
        activeStage = 'saving'
        setUploadPhase('saving')
        await finalizeMediaUpload(auth.user, attempt.operation)
      }
      console.info('[media-upload]', {
        event: 'MEDIA_FINALIZED',
        storagePath: attempt.operation.storagePath,
        durationMs: Date.now() - startedAt,
      })
      setUploadPhase('success')
      setFile(null)
      setAltText('')
      persistPendingUpload(null)
      setMessage('La imagen quedó cargada en Storage y registrada como borrador privado en Firestore.')
      setCursorStack([null])
      await loadPage(null)
    } catch (cause) {
      const stage = cause instanceof MediaUploadError ? cause.stage : activeStage
      const storagePath = cause instanceof MediaUploadError
        ? cause.storagePath
        : attempt?.operation.storagePath ?? 'pendiente de asignación'
      const errorCode = firebaseErrorCode(cause)
      const details = {
        event: 'UPLOAD_FAILED',
        stage,
        storagePath,
        durationMs: Date.now() - startedAt,
        ...(errorCode ? { errorCode } : {}),
      }
      console.warn('[media-upload]', details)
      setUploadPhase('error')
      const causeMessage = cause instanceof Error ? cause.message : 'No se pudo completar la operación.'
      setError(`${causeMessage} Ruta del intento: ${storagePath}.${attempt
        ? ' La próxima recuperación conservará el mismo ID; el servidor comprobará la propiedad y el SHA-256 antes de registrar el medio.'
        : ''}`)
    } finally {
      submissionLock.current = false
    }
  }

  async function changePublication(item: MediaRecord) {
    if (auth.status !== 'signed-in') return
    const publish = item.status !== 'published'
    try {
      await changeMediaState(auth.user, item.id, publish ? 'publish' : 'unpublish', item.updatedAt.toMillis())
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
      await changeMediaState(auth.user, item.id, 'archive', item.updatedAt.toMillis())
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
          <label className="field-span">Archivo<input type="file" accept={imageTypes.join(',')} disabled={uploadBusy} onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setUploadPhase('idle')
          }} /></label>
          <label className="field-span">Texto alternativo<input value={altText} onChange={(event) => {
            setAltText(event.target.value)
            setUploadPhase('idle')
          }} maxLength={500} required disabled={uploadBusy || pendingUpload !== null} /></label>
        </div>
        {previewUrl && <img className="media-preview" src={previewUrl} alt={altText || 'Vista previa local'} />}
        {uploadBusy && <p className="form-hint" role="status" aria-live="polite">
          {uploadPhase === 'validating' ? 'Validando archivo y permisos…' :
            uploadPhase === 'checking' ? 'Verificando la biblioteca…' :
              uploadPhase === 'uploading' ? `Subiendo a Storage… ${uploadProgress}%` :
                'Guardando el registro en Firestore…'}
        </p>}
        <Button type="submit" disabled={uploadBusy ||
          (!pendingUpload && (!file || !altText.trim())) ||
          (pendingUpload !== null && !pendingUpload.storageUploadAttempted && !file)}>
          {uploadBusy
            ? uploadPhase === 'saving' ? 'Guardando en Firestore…' :
              uploadPhase === 'uploading' ? `Subiendo a Storage… ${uploadProgress}%` :
                uploadPhase === 'checking' ? 'Verificando…' : 'Validando…'
            : pendingUpload ? pendingUpload.storageUploadAttempted
              ? file ? 'Recuperar o reintentar operación' : 'Recuperar registro pendiente'
              : 'Reintentar carga'
              : 'Subir como borrador privado'}
        </Button>
        {pendingUpload && uploadPhase === 'error' && <Button type="button" variant="ghost" onClick={() => {
          if (!window.confirm(`¿Descartar el intento ${pendingUpload.operation.storagePath}? No se borrará ningún archivo de Storage y podría quedar privado sin registro.`)) return
          persistPendingUpload(null)
          setUploadPhase('idle')
          setUploadProgress(0)
          setError('')
        }}>Descartar intento (no elimina el archivo)</Button>}
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
